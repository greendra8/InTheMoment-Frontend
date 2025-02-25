<script>
	import { onMount } from 'svelte';

	let canvas;
	let visualizer = null;
	let rendering = false;
	let audioContext = null;
	let sourceNode = null;
	let presets = {};
	let isVisible = true;
	let isTabActive = true;
	let animationFrameId = null;
	let visibilityObserver = null;
	let lastRenderTime = 0;
	let renderInterval = 1000 / 30; // Target 30fps by default
	let isLowPerfDevice = false;

	// Optimized resize function with debouncing
	let resizeTimeout;
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
		// but keep quality high for all devices
		if (isLowPerfDevice) {
			renderInterval = 1000 / 24; // Target 24fps for low-perf devices
		}
	}

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

	function pauseRenderer() {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		rendering = false;
	}

	function createSilentAudio() {
		if (!audioContext || !visualizer) return;

		try {
			const bufferSize = audioContext.sampleRate; // 1 second of silence is enough
			const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < bufferSize; i++) {
				data[i] = Math.random() * 0.1 - 0.05; // Small random noise to drive visuals
			}
			sourceNode = audioContext.createBufferSource();
			sourceNode.buffer = buffer;
			sourceNode.loop = true;

			const gainNode = audioContext.createGain();
			gainNode.gain.value = 0; // Mute the output
			sourceNode.connect(gainNode);
			gainNode.connect(audioContext.destination);

			visualizer.connectAudio(sourceNode); // Connect to visualizer directly
			sourceNode.start(0);

			if (!rendering) {
				startRenderer();
			}
		} catch (error) {
			console.error('Error creating silent audio:', error);
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

			// Get presets
			presets = {};
			if (window.butterchurnPresets) {
				Object.assign(presets, window.butterchurnPresets.getPresets());
			}
			if (window.butterchurnPresetsExtra) {
				Object.assign(presets, window.butterchurnPresetsExtra.getPresets());
			}

			// Get preset keys
			const presetKeys = Object.keys(presets);

			if (presetKeys.length === 0) {
				console.error('No presets available');
				return;
			}

			// Create visualizer with adjusted quality settings
			visualizer = window.butterchurn.default.createVisualizer(audioContext, canvas, {
				width: canvas.width,
				height: canvas.height,
				pixelRatio: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2x for performance
				textureRatio: isLowPerfDevice ? 0.8 : 1 // Keep 80% quality on mobile
			});

			// Select preset
			let presetKey;
			if (presetKeys.length > 60) {
				presetKey = presetKeys[22]; // 60 light, 22 dark
			} else {
				const randomIndex = Math.floor(Math.random() * presetKeys.length);
				presetKey = presetKeys[randomIndex];
			}

			visualizer.loadPreset(presets[presetKey], 0);

			// Start audio and rendering if visible
			if (isVisible) {
				createSilentAudio();
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

	onMount(() => {
		// Add event listeners
		window.addEventListener('resize', resizeCanvas);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Initialize canvas size
		resizeCanvas();

		// Initialize visualizer after scripts are loaded - use a shorter timeout
		const initTimeout = setTimeout(() => {
			initVisualizer();
		}, 300);

		return () => {
			// Clean up on component unmount
			clearTimeout(initTimeout);
			window.removeEventListener('resize', resizeCanvas);
			document.removeEventListener('visibilitychange', handleVisibilityChange);

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
			}
			if (audioContext) {
				try {
					audioContext.close();
				} catch (e) {
					console.error('Error closing audio context:', e);
				}
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
	<!-- Butterchurn dependencies - loaded with defer for better performance -->
	<script
		type="text/javascript"
		src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"
		defer
	></script>
	<script
		type="text/javascript"
		src="https://unpkg.com/butterchurn@2.6.7/lib/butterchurn.min.js"
		defer
	></script>
	<script
		type="text/javascript"
		src="https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresets.min.js"
		defer
	></script>
	<script
		type="text/javascript"
		src="https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresetsExtra.min.js"
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
					Discover AI-powered meditation journeys tailored to your unique mind and needs
				</p>
			</div>
			<div class="cta">
				<a href="/register" class="button primary">Begin Your Journey</a>
				<a href="/login" class="button secondary">Sign In</a>
			</div>
		</div>
	</div>
</section>

<div class="content-wrapper">
	<section class="intro-section">
		<div class="container">
			<h2 class="section-title">Transform Your Mental Wellbeing</h2>
			<p class="section-subtitle">
				In The Moment combines cutting-edge AI with mindfulness science to create personalized
				meditation experiences
			</p>
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
							<h3>AI-Powered Guidance</h3>
							<p>
								Our advanced algorithms analyze your preferences and goals to create truly unique
								meditation experiences
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
								Visualize your mindfulness journey with detailed insights and achievement milestones
							</p>
						</div>
					</div>
					<div class="feature-item">
						<div class="feature-icon">
							<i class="fas fa-user-circle"></i>
						</div>
						<div class="feature-content">
							<h3>Personalized Experience</h3>
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
						<h3>AI Generation</h3>
						<p>Our AI crafts a personalized meditation script and selects appropriate audio</p>
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
					<span>Advanced AI technology for truly personalized experiences</span>
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
					<span>Continuous learning algorithm that grows with your practice</span>
				</div>
				<div class="benefit-tag">
					<i class="fas fa-moon"></i>
					<span>Specialized sessions for sleep, focus, anxiety, and more</span>
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
				<p>Join thousands who have discovered the power of AI-driven meditation</p>
				<a href="/register" class="button primary large">Start Your Free Trial</a>
			</div>
		</div>
	</section>
</div>

<style>
	/* Base Styles */
	:global(body) {
		font-family: 'Inter', sans-serif;
		line-height: 1.6;
		color: #333;
		background-color: #fff;
		margin: 0;
		padding: 0;
	}

	h1,
	h2,
	h3,
	h4 {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 600;
	}

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
		color: white;
		background: rgba(0, 0, 0, 0.25);
	}

	.hero-text {
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-bottom: 2.5rem;
		max-width: 900px;
		width: 100%;
	}

	.hero-content h1 {
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
		border-radius: 50px;
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
		border-radius: 50px;
		padding: 0.8rem 1.5rem;
		display: flex;
		align-items: center;
		transition: all 0.3s ease;
		margin-bottom: 0.5rem;
		white-space: nowrap; /* Prevent wrapping on desktop */
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
</style>
