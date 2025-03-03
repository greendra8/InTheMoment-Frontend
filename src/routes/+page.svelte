<script>
	import { onMount } from 'svelte';
	import { setupAudioVisualizer } from '$lib/audioVisualizer';

	// Core visualization variables
	let canvas;
	let visualizer = null;
	let rendering = false;
	let audioContext = null;
	let sourceNode = null;
	let preset = null;

	// Optimization variables
	let isVisible = true;
	let isTabActive = true;
	let animationFrameId = null;
	let visibilityObserver = null;
	let lastRenderTime = 0;
	let renderInterval = 1000 / 30; // Target 30fps by default
	let isLowPerfDevice = false;
	let presetLoaded = false;
	let resizeTimeout;

	// Orb visualizer variables
	let orbCanvas;
	let orbAudio;
	let orbAudioContext;
	let orbAnalyser;
	let orbVisualizer;

	// Check if device is low performance
	function checkDevicePerformance() {
		// Simple heuristic - mobile devices or older browsers
		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
		const isOldBrowser = !window.requestAnimationFrame || !window.AudioContext;

		// More sophisticated check - available CPU cores
		const cpuCores = navigator.hardwareConcurrency || 4;

		// Only consider truly low-performance devices
		isLowPerfDevice = isOldBrowser || (isMobile && cpuCores <= 2);

		// Adjust render interval based on device performance
		if (isLowPerfDevice) {
			renderInterval = 1000 / 24; // Target 24fps for low-perf devices
		}
	}

	// Optimized renderer with throttling
	function startRenderer() {
		// Cancel any existing animation frame
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}

		const renderLoop = (timestamp) => {
			// Only render if visible, tab is active, and enough time has passed
			if (isVisible && isTabActive && visualizer) {
				const elapsed = timestamp - lastRenderTime;

				if (elapsed >= renderInterval) {
					visualizer.render();
					lastRenderTime = timestamp;
				}
			}

			animationFrameId = requestAnimationFrame(renderLoop);
		};

		animationFrameId = requestAnimationFrame(renderLoop);
		rendering = true;
	}

	// Clean pause function
	function pauseRenderer() {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		rendering = false;
	}

	// Optimized resize function with debouncing
	function resizeCanvas() {
		if (!canvas) return;

		// Clear any pending resize
		if (resizeTimeout) {
			clearTimeout(resizeTimeout);
		}

		// Debounce resize operations
		resizeTimeout = setTimeout(() => {
			try {
				const width = window.innerWidth;
				const height = Math.min(window.innerHeight * 0.8, 800); // Limit height

				// Only resize if dimensions actually changed
				if (canvas.width !== width || canvas.height !== height) {
					canvas.width = width;
					canvas.height = height;
					if (visualizer) {
						visualizer.setRendererSize(width, height);
					}
				}
			} catch (error) {
				console.error('Error resizing canvas:', error);
			}
		}, 100); // 100ms debounce
	}

	// Load a specific preset from a JSON file
	async function loadPreset() {
		try {
			// Fetch the preset JSON file
			const response = await fetch('/presets/flexi_+_amandio_c_-_organic12-3d-2.json');
			if (!response.ok) {
				throw new Error(`Failed to load preset: ${response.status} ${response.statusText}`);
			}

			preset = await response.json();
			presetLoaded = true;

			// If visualizer is already initialized, load the preset
			if (visualizer && preset) {
				visualizer.loadPreset(preset, 0);
			}

			return true;
		} catch (error) {
			console.error('Error loading preset:', error);
			return false;
		}
	}

	function initVisualizer() {
		if (!canvas) {
			console.error('Canvas element not found');
			return;
		}

		if (!window.butterchurn) {
			console.error('Butterchurn not loaded');
			return;
		}

		try {
			// Check device performance first
			checkDevicePerformance();

			// Create audio context
			audioContext = new (window.AudioContext || window.webkitAudioContext)();

			// Create visualizer with adjusted quality settings
			visualizer = window.butterchurn.default.createVisualizer(audioContext, canvas, {
				width: canvas.width,
				height: canvas.height,
				pixelRatio: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2x for performance
				textureRatio: isLowPerfDevice ? 0.8 : 1 // Keep 80% quality on mobile
			});

			// Load the preset if it's already fetched, otherwise wait for it
			if (presetLoaded && preset) {
				visualizer.loadPreset(preset, 0);
			}

			// Start rendering if visible
			if (isVisible) {
				startRenderer();
			}

			// Set up visibility observer
			setupVisibilityObserver();
		} catch (error) {
			console.error('Error initializing visualizer:', error);
		}
	}

	function setupVisibilityObserver() {
		// Set up Intersection Observer to detect when visualizer is in/out of view
		if ('IntersectionObserver' in window) {
			visibilityObserver = new IntersectionObserver(
				(entries) => {
					const [entry] = entries;
					isVisible = entry.isIntersecting;

					if (isVisible) {
						// Resume rendering when visible
						if (audioContext && audioContext.state === 'suspended') {
							audioContext.resume().catch((e) => console.error('Error resuming audio context:', e));
						}
						if (!rendering && visualizer) {
							startRenderer();
						}
					} else {
						// Pause rendering when not visible
						pauseRenderer();
						if (audioContext && audioContext.state === 'running') {
							audioContext
								.suspend()
								.catch((e) => console.error('Error suspending audio context:', e));
						}
					}
				},
				{ threshold: 0.1 } // Consider visible when at least 10% is in view
			);

			if (canvas) {
				visibilityObserver.observe(canvas);
			}
		}
	}

	function handleVisibilityChange() {
		isTabActive = document.visibilityState === 'visible';

		if (isTabActive) {
			// Resume when tab becomes active
			if (isVisible && !rendering && visualizer) {
				if (audioContext && audioContext.state === 'suspended') {
					audioContext.resume().catch((e) => console.error('Error resuming audio context:', e));
				}
				startRenderer();
			}
		} else {
			// Pause when tab becomes inactive
			pauseRenderer();
			if (audioContext && audioContext.state === 'running') {
				audioContext.suspend().catch((e) => console.error('Error suspending audio context:', e));
			}
		}
	}

	// Clean up resources
	function cleanup() {
		if (resizeTimeout) clearTimeout(resizeTimeout);

		if (visibilityObserver && canvas) {
			visibilityObserver.unobserve(canvas);
			visibilityObserver = null;
		}

		pauseRenderer();

		if (sourceNode) {
			try {
				sourceNode.stop();
			} catch (e) {
				console.error('Error stopping source node:', e);
			}
			sourceNode = null;
		}

		if (audioContext) {
			try {
				audioContext.close();
			} catch (e) {
				console.error('Error closing audio context:', e);
			}
			audioContext = null;
		}

		visualizer = null;
		preset = null;
	}

	// Setup orb visualizer
	function setupOrb() {
		if (!orbCanvas || !orbAudio) return;

		try {
			orbAudioContext = new (window.AudioContext || window.webkitAudioContext)();
			orbAnalyser = orbAudioContext.createAnalyser();
			orbAnalyser.fftSize = 1024;

			const bufferSize = orbAudioContext.sampleRate * 2;
			const buffer = orbAudioContext.createBuffer(1, bufferSize, orbAudioContext.sampleRate);
			const data = buffer.getChannelData(0);

			for (let i = 0; i < bufferSize; i++) {
				data[i] = (Math.random() * 2 - 1) * 0.001;
			}

			const source = orbAudioContext.createBufferSource();
			source.buffer = buffer;
			source.loop = true;

			// Add gain node to mute output
			const gainNode = orbAudioContext.createGain();
			gainNode.gain.value = 0;

			source.connect(orbAnalyser); // For visualization
			orbAnalyser.connect(gainNode); // Pass through analyser
			gainNode.connect(orbAudioContext.destination); // Muted output

			source.start(0);

			const orbContainer = orbCanvas.parentElement;
			const size = Math.min(orbContainer.clientWidth, 300);
			orbCanvas.width = size;
			orbCanvas.height = size;

			orbVisualizer = setupAudioVisualizer(orbAudio, orbCanvas, orbAnalyser, size, size);
			if (orbVisualizer) {
				orbVisualizer.setStandbyMode(true);
			}
		} catch (error) {
			console.error('Error setting up orb visualizer:', error);
		}
	}

	onMount(async () => {
		// Add event listeners
		window.addEventListener('resize', resizeCanvas);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Initialize canvas size
		resizeCanvas();

		// Start loading the preset
		await loadPreset();

		// Initialize visualizer after scripts are loaded
		const initTimeout = setTimeout(() => {
			initVisualizer();
		}, 300);

		// Setup orb visualizer after a short delay
		setTimeout(() => {
			setupOrb();
		}, 500);

		return () => {
			// Clean up on component unmount
			clearTimeout(initTimeout);
			window.removeEventListener('resize', resizeCanvas);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			cleanup();

			// Clean up orb visualizer
			if (orbAudioContext) {
				orbAudioContext
					.close()
					.catch((err) => console.error('Error closing orb audio context:', err));
			}
		};
	});
</script>

<svelte:head>
	<title>InTheMoment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
	<!-- Butterchurn core library only -->
	<script
		type="text/javascript"
		src="https://unpkg.com/butterchurn@2.6.7/lib/butterchurn.min.js"
		defer
	></script>
</svelte:head>

<section class="hero-container">
	<div class="visualizer-wrapper">
		<canvas bind:this={canvas} class="visualizer-canvas"></canvas>
		<div class="hero-content">
			<div class="hero-text">
				<h1>Mindfulness Reimagined</h1>
				<p class="tagline">
					Discover personalised meditation sessions tailored to your unique mind and needs
				</p>
			</div>
			<div class="cta">
				<a href="/register" class="button primary">Begin Your Journey</a>
				<a href="/login" class="button secondary">Sign In</a>
			</div>

			<!-- Scroll Down Indicator -->
			<div class="scroll-indicator">
				<div class="scroll-arrow">
					<i class="fas fa-chevron-down"></i>
				</div>
				<span class="scroll-text">Scroll Down</span>
			</div>
		</div>
	</div>
</section>

<div class="content-wrapper">
	<section class="intro-section">
		<div class="container">
			<h2 class="section-title">Transform Your Mental Wellbeing</h2>
			<p class="section-subtitle">
				In The Moment combines mindfulness science with personalised guidance to create meditation
				sessions that adapt to you
			</p>
		</div>
	</section>

	<!-- Orb Visualizer Section -->
	<section class="orb-section">
		<div class="container">
			<div class="orb-container">
				<div class="orb-wrapper">
					<canvas bind:this={orbCanvas} class="orb-canvas"></canvas>
					<audio bind:this={orbAudio} crossorigin="anonymous" style="display: none;"></audio>
				</div>
				<div class="orb-content">
					<h2 class="section-title">Meet Your Mentor</h2>
					<p class="section-description">
						This dynamic orb visualises your personal meditation assistant, responding to your
						progress and helping you achieve deeper mindfulness with each session.
					</p>
				</div>
			</div>
		</div>
	</section>

	<section class="features-section">
		<div class="container">
			<div class="features-wrapper">
				<div class="feature-column">
					<div class="feature-item">
						<div class="feature-icon">
							<i class="fas fa-brain"></i>
						</div>
						<div class="feature-content">
							<h3>Personalised Guidance</h3>
							<p>
								Our adaptive approach analyses your preferences and goals to create truly unique
								meditation sessions
							</p>
						</div>
					</div>
					<div class="feature-item">
						<div class="feature-icon">
							<i class="fas fa-headphones-alt"></i>
						</div>
						<div class="feature-content">
							<h3>Immersive Audio</h3>
							<p>
								Experience crystal-clear guided meditations with dynamic soundscapes designed for
								deep focus
							</p>
						</div>
					</div>
				</div>
				<div class="feature-column">
					<div class="feature-item">
						<div class="feature-icon">
							<i class="fas fa-chart-line"></i>
						</div>
						<div class="feature-content">
							<h3>Progress Tracking</h3>
							<p>
								Visualise your mindfulness journey with detailed insights and achievement milestones
							</p>
						</div>
					</div>
					<div class="feature-item">
						<div class="feature-icon">
							<i class="fas fa-user-circle"></i>
						</div>
						<div class="feature-content">
							<h3>Personalised Experience</h3>
							<p>
								Every session adapts to your feedback, creating a meditation practice that evolves
								with you
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="how-it-works-section">
		<div class="container">
			<h2 class="section-title">How It Works</h2>
			<div class="timeline">
				<div class="timeline-item">
					<div class="timeline-marker">1</div>
					<div class="timeline-content">
						<h3>Create Your Profile</h3>
						<p>Answer a few questions about your meditation goals and preferences</p>
					</div>
				</div>
				<div class="timeline-item">
					<div class="timeline-marker">2</div>
					<div class="timeline-content">
						<h3>Custom Creation</h3>
						<p>
							Our system crafts a personalised meditation script, spoken aloud by a comforting voice
						</p>
					</div>
				</div>
				<div class="timeline-item">
					<div class="timeline-marker">3</div>
					<div class="timeline-content">
						<h3>Immersive Experience</h3>
						<p>Listen to your custom meditation with our interactive audio player</p>
					</div>
				</div>
				<div class="timeline-item">
					<div class="timeline-marker">4</div>
					<div class="timeline-content">
						<h3>Continuous Improvement</h3>
						<p>Provide feedback to refine future sessions and track your progress</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="benefits-section">
		<div class="container">
			<h2 class="section-title">Why Choose In The Moment?</h2>
			<div class="benefits-wrapper">
				<div class="benefit-tag">
					<i class="fas fa-brain"></i>
					<span>Expert-crafted content personalised to your unique needs</span>
				</div>
				<div class="benefit-tag">
					<i class="fas fa-palette"></i>
					<span>Beautiful, responsive design that works on all your devices</span>
				</div>
				<div class="benefit-tag">
					<i class="fas fa-lock"></i>
					<span>Secure user profiles with enterprise-grade data protection</span>
				</div>
				<div class="benefit-tag">
					<i class="fas fa-seedling"></i>
					<span>Adaptive learning system that grows with your practice</span>
				</div>
				<div class="benefit-tag">
					<i class="fas fa-moon"></i>
					<span>Specialised sessions for sleep, focus, anxiety, and more</span>
				</div>
				<div class="benefit-tag">
					<i class="fas fa-heart"></i>
					<span>Science-backed approach to mental wellbeing</span>
				</div>
			</div>
		</div>
	</section>

	<section class="mobile-section">
		<div class="container">
			<div class="mobile-content">
				<h2 class="section-title">Take In The Moment Everywhere</h2>
				<p class="section-subtitle">Native mobile apps coming soon to iOS and Android</p>
				<div class="app-platforms">
					<div class="platform">
						<i class="fab fa-android"></i>
						<span>Android</span>
					</div>
					<div class="platform">
						<i class="fab fa-apple"></i>
						<span>iOS</span>
					</div>
				</div>
				<p class="mobile-feature">
					Enjoy offline support for uninterrupted meditation, anywhere you go
				</p>
			</div>
		</div>
	</section>

	<section class="cta-section">
		<div class="container">
			<div class="cta-content">
				<h2>Ready to Transform Your Mindfulness Practice?</h2>
				<p>Join thousands who have discovered the power of personalised meditation</p>
				<a href="/register" class="button primary large">Start Your Free Trial</a>
			</div>
		</div>
	</section>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	/* Hero Section */
	.hero-container {
		margin: 0;
		overflow: hidden;
		width: 100%;
		position: relative;
	}

	.visualizer-wrapper {
		position: relative;
		width: 100vw;
		height: 100vh;
		max-height: 100vh;
		min-height: 600px;
		overflow: hidden;
		left: 50%;
		right: 50%;
		margin-left: -50vw;
		margin-right: -50vw;
	}

	.visualizer-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		background-color: #000;
	}

	.hero-content {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		z-index: 2;
		padding: 2rem;
		box-sizing: border-box;
		background: rgba(0, 0, 0, 0.25);
	}

	.hero-text {
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-bottom: 2.5rem;
		max-width: 900px;
		width: 100%;
	}

	.hero-content h1 {
		color: #fff;
		font-size: clamp(3rem, 6vw, 5rem);
		margin-bottom: 1.5rem;
		text-align: center;
		line-height: 1.1;
		width: 100%;
		letter-spacing: -0.02em;
	}

	.tagline {
		font-size: clamp(1.2rem, 2.5vw, 1.6rem);
		margin-bottom: 0;
		color: white;
		max-width: 700px;
		text-align: center;
		line-height: 1.5;
		width: 100%;
		font-weight: 400;
	}

	.cta {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.5rem;
		width: 100%;
		max-width: 600px;
	}

	.button {
		display: inline-block;
		padding: 1rem 2rem;
		font-size: 1.1rem;
		text-decoration: none;
		border-radius: 5px;
		transition: all 0.3s ease;
		font-weight: 600;
		min-width: 200px;
		box-sizing: border-box;
		text-align: center;
		letter-spacing: 0.5px;
	}

	.button.large {
		padding: 1.2rem 2.5rem;
		font-size: 1.2rem;
		min-width: 250px;
	}

	.button.primary {
		background-color: #ffffff;
		color: #000;
		border: none;
		box-shadow: 0 4px 14px rgba(255, 255, 255, 0.3);
	}

	.button.primary:hover {
		background-color: #f0f0f0;
		transform: translateY(-3px);
		box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
	}

	.button.secondary {
		background-color: transparent;
		color: white;
		border: 2px solid rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(4px);
	}

	.button.secondary:hover {
		background-color: rgba(255, 255, 255, 0.15);
		transform: translateY(-3px);
	}

	/* Content Sections */
	.content-wrapper {
		width: 100%;
		margin: 0 auto;
	}

	.section-title {
		font-size: clamp(2rem, 4vw, 2.8rem);
		margin-bottom: 1.5rem;
		text-align: center;
		color: #1a1a1a;
	}

	.section-subtitle {
		font-size: clamp(1.1rem, 2vw, 1.3rem);
		text-align: center;
		max-width: 800px;
		margin: 0 auto 3rem;
		color: #4a4a4a;
	}

	/* Intro Section */
	.intro-section {
		padding: 5rem 1rem;
		background-color: #f8f8f8;
		text-align: center;
	}

	/* Features Section */
	.features-section {
		padding: 5rem 1rem;
		background-color: #fff;
	}

	.features-wrapper {
		display: flex;
		gap: 2rem;
		margin-top: 3rem;
	}

	.feature-column {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.feature-item {
		display: flex;
		align-items: flex-start;
		background-color: #f8f8f8;
		border-radius: 16px;
		padding: 2rem;
		transition: all 0.3s ease;
		height: 100%;
	}

	.feature-item:hover {
		transform: translateY(-5px);
		box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
		background-color: #fff;
	}

	.feature-icon {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1.5rem;
		color: white;
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.feature-content h3 {
		font-size: 1.4rem;
		margin: 0 0 0.8rem 0;
		color: #1a1a1a;
	}

	.feature-content p {
		margin: 0;
		color: #4a4a4a;
		font-size: 1rem;
		line-height: 1.6;
	}

	/* How It Works Section */
	.how-it-works-section {
		padding: 5rem 1rem;
		background-color: #f0f0f0;
	}

	.timeline {
		position: relative;
		max-width: 800px;
		margin: 3rem auto 0;
	}

	.timeline::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 24px;
		width: 2px;
		background-color: #000;
	}

	.timeline-item {
		position: relative;
		padding-left: 70px;
		margin-bottom: 2.5rem;
	}

	.timeline-item:last-child {
		margin-bottom: 0;
	}

	.timeline-marker {
		position: absolute;
		left: 0;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background-color: #000;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 1.2rem;
		z-index: 2;
	}

	.timeline-content {
		background-color: #fff;
		padding: 1.5rem 2rem;
		border-radius: 8px;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
	}

	.timeline-content h3 {
		margin: 0 0 0.5rem 0;
		color: #1a1a1a;
		font-size: 1.3rem;
	}

	.timeline-content p {
		margin: 0;
		color: #4a4a4a;
	}

	/* Benefits Section */
	.benefits-section {
		padding: 5rem 1rem;
		background-color: #fff;
	}

	.benefits-wrapper {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
		margin-top: 3rem;
	}

	.benefit-tag {
		background-color: #f0f0f0;
		color: #1a1a1a;
		border-radius: 50px;
		padding: 0.8rem 1.5rem;
		display: flex;
		align-items: center;
		transition: all 0.3s ease;
		margin-bottom: 0.5rem;
	}

	.benefit-tag:hover {
		background-color: #000;
		color: white;
		transform: translateY(-3px);
	}

	.benefit-tag i {
		font-size: 1.2rem;
		margin-right: 0.8rem;
		transition: all 0.3s ease;
	}

	.benefit-tag span {
		font-size: 1rem;
		font-weight: 500;
	}

	/* Mobile Section */
	.mobile-section {
		padding: 5rem 1rem;
		background-color: #f0f0f0;
		text-align: center;
	}

	.mobile-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.app-platforms {
		display: flex;
		justify-content: center;
		gap: 4rem;
		margin: 3rem 0;
	}

	.platform {
		display: flex;
		flex-direction: column;
		align-items: center;
		transition: all 0.3s ease;
	}

	.platform:hover {
		transform: translateY(-5px);
	}

	.platform i {
		font-size: 4rem;
		margin-bottom: 1rem;
		color: #000;
	}

	.platform span {
		font-weight: 600;
		font-size: 1.2rem;
		color: #1a1a1a;
	}

	.mobile-feature {
		font-size: 1.1rem;
		color: #4a4a4a;
		margin-top: 2rem;
	}

	/* CTA Section */
	.cta-section {
		padding: 5rem 1rem;
		background-color: #000;
		color: white;
		text-align: center;
	}

	.cta-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.cta-content h2 {
		font-size: clamp(2rem, 4vw, 2.8rem);
		margin-bottom: 1.5rem;
		color: white;
	}

	.cta-content p {
		font-size: 1.2rem;
		margin-bottom: 2.5rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.cta-section .button.primary {
		background-color: white;
		color: #000;
		box-shadow: 0 4px 14px rgba(255, 255, 255, 0.3);
	}

	.cta-section .button.primary:hover {
		background-color: #f0f0f0;
		box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
	}

	/* Responsive Styles */
	@media (max-width: 1024px) {
		.features-wrapper {
			flex-direction: column;
		}
	}

	@media (max-width: 768px) {
		.hero-content {
			padding: 1.5rem;
		}

		.cta {
			max-width: 100%;
			padding: 0 1rem;
		}

		.app-platforms {
			gap: 3rem;
		}

		/* Allow benefit tags to wrap on mobile */
		.benefit-tag {
			white-space: normal;
		}
	}

	@media (max-width: 600px) {
		.visualizer-wrapper {
			min-height: 500px;
		}

		.hero-content {
			padding: 1.5rem;
			justify-content: flex-start;
			padding-top: 35%;
		}

		.hero-text {
			margin-bottom: 2rem;
		}

		.hero-content h1 {
			margin-bottom: 1rem;
			font-size: clamp(2.5rem, 10vw, 3.5rem);
		}

		.tagline {
			font-size: clamp(1rem, 4vw, 1.2rem);
		}

		.cta {
			flex-direction: column;
			width: 100%;
			max-width: 300px;
			gap: 1rem;
		}

		.button {
			width: 100%;
			max-width: 100%;
			min-width: unset;
		}

		.section-title {
			font-size: 1.8rem;
		}

		.section-subtitle {
			font-size: 1rem;
		}

		.feature-item {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.feature-icon {
			margin-right: 0;
			margin-bottom: 1rem;
		}

		.timeline::before {
			left: 20px;
		}

		.timeline-marker {
			width: 40px;
			height: 40px;
		}

		.timeline-item {
			padding-left: 60px;
		}

		.app-platforms {
			gap: 2rem;
		}

		.platform i {
			font-size: 3rem;
		}

		.scroll-indicator {
			bottom: 30px;
		}

		.scroll-arrow {
			font-size: 20px;
			margin-bottom: 5px;
		}

		.scroll-text {
			font-size: 12px;
		}
	}

	@media (max-width: 350px) {
		.hero-content h1 {
			font-size: 2.3rem;
		}

		.tagline {
			font-size: 0.95rem;
		}

		.button {
			padding: 0.8rem 1.5rem;
			font-size: 1rem;
		}
	}

	/* Scroll Indicator */
	.scroll-indicator {
		position: absolute;
		bottom: 80px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		color: white;
		opacity: 0.8;
		transition: opacity 0.3s ease;
		animation: bounce 2s infinite;
	}

	.scroll-indicator:hover {
		opacity: 1;
		animation-play-state: paused;
	}

	.scroll-arrow {
		font-size: 24px;
		margin-bottom: 8px;
	}

	.scroll-text {
		font-size: 14px;
		font-weight: 500;
		letter-spacing: 1px;
		text-transform: uppercase;
	}

	@keyframes bounce {
		0%,
		20%,
		50%,
		80%,
		100% {
			transform: translateY(0) translateX(-50%);
		}
		40% {
			transform: translateY(-10px) translateX(-50%);
		}
		60% {
			transform: translateY(-5px) translateX(-50%);
		}
	}

	/* Orb Visualizer Section Styles */
	.orb-section {
		padding: 4rem 0;
		background: #f0f0f0;
		overflow: hidden;
	}

	.orb-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 3rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	.orb-wrapper {
		position: relative;
		width: 300px;
		height: 300px;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
	}

	.orb-canvas {
		border-radius: 50%;
	}

	.orb-content {
		max-width: 500px;
	}

	.orb-content h2 {
		text-align: left;
		margin-bottom: 1.5rem;
		font-size: 2.5rem;
		color: #333;
	}

	.orb-content .section-description {
		margin-bottom: 2rem;
		font-size: 1.1rem;
		line-height: 1.6;
		color: #666;
	}

	@media (max-width: 900px) {
		.orb-container {
			flex-direction: column;
			text-align: center;
			gap: 2rem;
		}

		.orb-wrapper {
			width: 250px;
			height: 250px;
		}

		.orb-content h2 {
			text-align: center;
		}

		.orb-content h2 {
			font-size: 2rem;
		}
	}

	@media (max-width: 600px) {
		.orb-section {
			padding: 3rem 0;
		}

		.orb-wrapper {
			width: 200px;
			height: 200px;
		}

		.orb-content h2 {
			font-size: 1.8rem;
		}

		.orb-content .section-description {
			font-size: 1rem;
		}
	}
</style>
