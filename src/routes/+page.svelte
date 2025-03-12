<script>
	import { onMount } from 'svelte';
	import { setupAudioVisualizer } from '$lib/audioVisualizer';
	import { browser } from '$app/environment';

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

	// Video background variables
	let videoElement;
	let videoWrapper;
	let isVideoLoaded = false;

	// Check if device is low performance
	function checkDevicePerformance() {
		if (!browser) return false;

		// Simple heuristic - mobile devices or older browsers
		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
		const isOldBrowser = !window.requestAnimationFrame;

		// More sophisticated check - available CPU cores
		const cpuCores = navigator.hardwareConcurrency || 4;

		// Only consider truly low-performance devices
		return isOldBrowser || (isMobile && cpuCores <= 2);
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
			isLowPerfDevice = checkDevicePerformance();

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
		if (!browser || !videoWrapper) return;

		// Set up Intersection Observer to detect when video is in/out of view
		if ('IntersectionObserver' in window) {
			visibilityObserver = new IntersectionObserver(
				(entries) => {
					const [entry] = entries;
					isVisible = entry.isIntersecting;

					if (isVisible && isTabActive && videoElement) {
						// Only try to play if user has interacted with the page
						if (document.documentElement.classList.contains('user-interacted')) {
							videoElement.play().catch((e) => {
								console.log('Video play prevented by browser, waiting for user interaction');
							});
						}
					} else if (videoElement) {
						videoElement.pause();
					}
				},
				{ threshold: 0.1 } // Consider visible when at least 10% is in view
			);

			visibilityObserver.observe(videoWrapper);
		}
	}

	function handleVisibilityChange() {
		if (!browser) return;

		isTabActive = document.visibilityState === 'visible';

		if (isTabActive && isVisible && videoElement) {
			// Only try to play if user has interacted with the page
			if (document.documentElement.classList.contains('user-interacted')) {
				videoElement.play().catch((e) => {
					console.log('Video play prevented by browser, waiting for user interaction');
				});
			}
		} else if (videoElement) {
			videoElement.pause();
		}
	}

	// Clean up resources
	function cleanup() {
		if (resizeTimeout) clearTimeout(resizeTimeout);

		if (visibilityObserver && videoWrapper) {
			visibilityObserver.unobserve(videoWrapper);
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
		if (!browser || !orbCanvas || !orbAudio) return;

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

	// Handle user interaction to enable autoplay
	function handleUserInteraction() {
		if (!browser) return;

		document.documentElement.classList.add('user-interacted');

		if (videoElement && isVisible && isTabActive) {
			videoElement.play().catch((e) => {
				console.log('Video play still prevented by browser');
			});
		}

		// Remove event listeners once user has interacted
		document.removeEventListener('click', handleUserInteraction);
		document.removeEventListener('keydown', handleUserInteraction);
		document.removeEventListener('touchstart', handleUserInteraction);
	}

	onMount(() => {
		if (!browser) return;

		// Add event listeners
		window.addEventListener('resize', resizeCanvas);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Add event listeners for user interaction
		document.addEventListener('click', handleUserInteraction);
		document.addEventListener('keydown', handleUserInteraction);
		document.addEventListener('touchstart', handleUserInteraction);

		// Initialize canvas size
		resizeCanvas();

		// Start loading the preset
		loadPreset();

		// Initialize visualizer after scripts are loaded
		const initTimeout = setTimeout(() => {
			initVisualizer();
		}, 300);

		// Setup orb visualizer after a short delay
		setTimeout(() => {
			setupOrb();
		}, 500);

		// Check if low performance device
		const isLowPerf = checkDevicePerformance();

		// Setup video playback
		if (videoElement) {
			videoElement.muted = true;
			videoElement.loop = true;
			videoElement.playsInline = true;

			// Lower quality for low performance devices
			if (isLowPerf) {
				videoElement.setAttribute('data-quality', 'low');
			}

			// Start playing when loaded
			videoElement.addEventListener('loadeddata', () => {
				isVideoLoaded = true;
				// We'll try to play, but this will likely be blocked until user interaction
				if (isTabActive && isVisible) {
					videoElement.play().catch((e) => {
						console.log('Video autoplay prevented by browser, waiting for user interaction');
					});
				}
			});
		}

		// Setup visibility observer
		setupVisibilityObserver();

		return cleanup;
	});
</script>

<svelte:head>
	<title>InTheMoment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap"
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
		crossorigin="anonymous"
		defer
	></script>
</svelte:head>

<section class="hero-container">
	<div class="video-wrapper" bind:this={videoWrapper}>
		<video
			bind:this={videoElement}
			class="background-video"
			preload="auto"
			muted
			autoplay
			loop
			playsinline
			disablePictureInPicture
			disableRemotePlayback
		>
			<source src="/video/phone-addiction.mp4" type="video/mp4" />
		</video>
		<div class="video-overlay"></div>
		<div class="grain-overlay"></div>
		<div class="hero-content">
			<div class="hero-text">
				<p class="small-title">Don't miss life</p>
				<h1>Live in the moment</h1>
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
			<h2 class="section-title centered-title">Transform Your Mental Wellbeing</h2>
			<p class="section-subtitle">
				In The Moment combines mindfulness science with personalised guidance to create meditation
				sessions that adapt to you
			</p>
		</div>
	</section>

	<!-- Orb Visualizer Section -->
	<section class="orb-section">
		<div class="container">
			<h2 class="section-title orb-title">Meet Your Mentor</h2>

			<div class="orb-container">
				<div class="orb-wrapper">
					<canvas bind:this={orbCanvas} class="orb-canvas"></canvas>
					<audio bind:this={orbAudio} crossorigin="anonymous" style="display: none;"></audio>
				</div>
				<div class="orb-content">
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
			<h2 class="section-title centered-title">Features</h2>
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
			<h2 class="section-title centered-title">How It Works</h2>
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
			<h2 class="section-title centered-title">Why Choose In The Moment?</h2>
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
				<h2 class="section-title centered-title">Take In The Moment Everywhere</h2>
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
		height: 50vh;
		min-height: 400px;
	}

	.video-wrapper {
		position: relative;
		width: 100vw;
		height: 50vh;
		max-height: 600px;
		min-height: 400px;
		overflow: hidden;
		left: 50%;
		right: 50%;
		margin-left: -50vw;
		margin-right: -50vw;
	}

	.background-video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: 1;
		pointer-events: none; /* Make video non-interactable */
		user-select: none; /* Prevent selection */
	}

	.video-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(10, 10, 32, 0.7); /* Dark overlay with opacity */
		z-index: 2;
	}

	.grain-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=');
		opacity: 0.4;
		z-index: 3;
		pointer-events: none;
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
		z-index: 4;
		padding: 2rem;
		box-sizing: border-box;
	}

	/* Video quality adjustments for low-performance devices */
	video[data-quality='low'] {
		filter: blur(1px);
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

	.small-title {
		font-size: clamp(1.2rem, 2.5vw, 1.6rem);
		margin-bottom: 0.5rem;
		color: var(--text-primary);
		text-align: center;
		line-height: 1.5;
		width: 100%;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 2px;
		text-shadow: 0 0 15px rgba(106, 90, 205, 0.3);
	}

	.hero-content h1 {
		color: var(--text-primary);
		font-size: clamp(3.5rem, 8vw, 6rem);
		margin-bottom: 1.5rem;
		text-align: center;
		line-height: 1.1;
		width: 100%;
		letter-spacing: -0.02em;
		font-family: 'Poppins', sans-serif;
		font-weight: 700;
		text-shadow: 0 0 20px rgba(106, 90, 205, 0.4);
		text-transform: capitalize;
	}

	.tagline {
		font-size: clamp(1.2rem, 2.5vw, 1.6rem);
		margin-bottom: 0;
		color: var(--text-primary);
		max-width: 700px;
		text-align: center;
		line-height: 1.5;
		width: 100%;
		font-weight: 400;
		text-shadow: 0 0 15px rgba(106, 90, 205, 0.3);
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
		border-radius: 12px;
		transition: all 0.3s ease;
		font-weight: 600;
		min-width: 200px;
		box-sizing: border-box;
		text-align: center;
		letter-spacing: 0.5px;
		font-family: 'Poppins', sans-serif;
		position: relative;
		overflow: hidden;
	}

	.button.large {
		padding: 1.2rem 2.5rem;
		font-size: 1.2rem;
		min-width: 250px;
	}

	.button.primary {
		background: linear-gradient(135deg, rgba(106, 90, 205, 0.8) 0%, rgba(132, 112, 255, 0.9) 100%);
		color: var(--text-primary);
		border: 1px solid rgba(123, 104, 238, 0.3);
		box-shadow: 0 4px 20px rgba(106, 90, 205, 0.4);
	}

	.button.primary:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 25px rgba(106, 90, 205, 0.6);
		background: linear-gradient(135deg, rgba(106, 90, 205, 0.9) 0%, rgba(132, 112, 255, 1) 100%);
	}

	.button.secondary {
		background: rgba(22, 22, 45, 0.5);
		color: var(--text-primary);
		border: 1px solid rgba(123, 104, 238, 0.25);
		backdrop-filter: blur(4px);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
	}

	.button.secondary:hover {
		background: rgba(22, 22, 45, 0.7);
		transform: translateY(-3px);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
		border-color: rgba(123, 104, 238, 0.4);
	}

	/* Content Sections */
	.content-wrapper {
		width: 100%;
		margin: 0 auto;
		background: var(--background-image);
		background-attachment: var(--background-attachment);
		background-size: var(--background-size);
	}

	.section-title {
		font-size: clamp(2rem, 4vw, 2.8rem);
		margin-bottom: 1.5rem;
		color: var(--text-primary);
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		position: relative;
		display: inline-block;
	}

	.section-title::after {
		content: '';
		position: absolute;
		bottom: -8px;
		left: 0;
		width: 60px;
		height: 2px;
		background: linear-gradient(90deg, rgba(106, 90, 205, 0.6), rgba(132, 112, 255, 0.6));
		border-radius: 2px;
	}

	.section-subtitle {
		font-size: clamp(1.1rem, 2vw, 1.3rem);
		text-align: center;
		max-width: 800px;
		margin: 0 auto 3rem;
		color: var(--text-secondary);
	}

	/* Intro Section */
	.intro-section {
		padding: 5rem 1rem;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.intro-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(106, 90, 205, 0.3), transparent);
	}

	/* Features Section */
	.features-section {
		padding: 5rem 1rem;
		position: relative;
		overflow: hidden;
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
		background: linear-gradient(135deg, rgba(22, 22, 45, 0.85) 0%, rgba(28, 28, 55, 0.75) 100%);
		border-radius: 16px;
		padding: 2rem;
		transition: all 0.3s ease;
		height: 100%;
		border: 1px solid rgba(123, 104, 238, 0.15);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(5px);
	}

	.feature-item:hover {
		transform: translateY(-5px);
		box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
		border-color: rgba(123, 104, 238, 0.3);
	}

	.feature-icon {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(106, 90, 205, 0.2) 0%, rgba(132, 112, 255, 0.3) 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1.5rem;
		color: var(--icon-primary);
		font-size: 1.5rem;
		flex-shrink: 0;
		border: 1px solid rgba(123, 104, 238, 0.2);
		box-shadow: 0 0 15px rgba(106, 90, 205, 0.2);
	}

	.feature-content h3 {
		font-size: 1.4rem;
		margin: 0 0 0.8rem 0;
		color: var(--text-primary);
		font-family: 'Poppins', sans-serif;
		font-weight: 500;
	}

	.feature-content p {
		margin: 0;
		color: var(--text-secondary);
		font-size: 1rem;
		line-height: 1.6;
	}

	/* Orb Section */
	.orb-section {
		padding: 4rem 0;
		position: relative;
		overflow: hidden;
	}

	.orb-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(106, 90, 205, 0.3), transparent);
	}

	.orb-title {
		margin-bottom: 3rem;
		display: block;
		text-align: center;
	}

	.orb-title::after {
		left: 50%;
		transform: translateX(-50%);
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
		border-radius: 50%;
		box-shadow: 0 0 30px rgba(106, 90, 205, 0.3);
		overflow: hidden;
	}

	.orb-canvas {
		border-radius: 50%;
		border: 1px solid rgba(123, 104, 238, 0.2);
	}

	.orb-content {
		max-width: 500px;
	}

	.orb-content .section-description {
		font-size: 1.1rem;
		line-height: 1.6;
		color: var(--text-secondary);
		margin: 0;
	}

	/* How It Works Section */
	.how-it-works-section {
		padding: 5rem 1rem;
		position: relative;
		overflow: hidden;
	}

	.how-it-works-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(106, 90, 205, 0.3), transparent);
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
		background: linear-gradient(
			to bottom,
			rgba(106, 90, 205, 0.3),
			rgba(132, 112, 255, 0.6),
			rgba(106, 90, 205, 0.3)
		);
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
		background: linear-gradient(135deg, rgba(106, 90, 205, 0.8) 0%, rgba(132, 112, 255, 0.9) 100%);
		color: var(--text-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 1.2rem;
		z-index: 2;
		box-shadow: 0 0 15px rgba(106, 90, 205, 0.4);
		border: 1px solid rgba(123, 104, 238, 0.3);
	}

	.timeline-content {
		background: linear-gradient(135deg, rgba(22, 22, 45, 0.85) 0%, rgba(28, 28, 55, 0.75) 100%);
		padding: 1.5rem 2rem;
		border-radius: 12px;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(123, 104, 238, 0.15);
		backdrop-filter: blur(5px);
	}

	.timeline-content h3 {
		margin: 0 0 0.5rem 0;
		color: var(--text-primary);
		font-size: 1.3rem;
		font-family: 'Poppins', sans-serif;
		font-weight: 500;
	}

	.timeline-content p {
		margin: 0;
		color: var(--text-secondary);
	}

	/* Benefits Section */
	.benefits-section {
		padding: 5rem 1rem;
		position: relative;
		overflow: hidden;
	}

	.benefits-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(106, 90, 205, 0.3), transparent);
	}

	.benefits-wrapper {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
		margin-top: 3rem;
	}

	.benefit-tag {
		background: linear-gradient(135deg, rgba(22, 22, 45, 0.7) 0%, rgba(28, 28, 55, 0.6) 100%);
		color: var(--text-primary);
		border-radius: 50px;
		padding: 0.8rem 1.5rem;
		display: flex;
		align-items: center;
		transition: all 0.3s ease;
		margin-bottom: 0.5rem;
		border: 1px solid rgba(123, 104, 238, 0.15);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(5px);
	}

	.benefit-tag:hover {
		background: linear-gradient(135deg, rgba(106, 90, 205, 0.2) 0%, rgba(132, 112, 255, 0.3) 100%);
		color: var(--text-primary);
		transform: translateY(-3px);
		box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
		border-color: rgba(123, 104, 238, 0.3);
	}

	.benefit-tag i {
		font-size: 1.2rem;
		margin-right: 0.8rem;
		transition: all 0.3s ease;
		color: var(--icon-primary);
	}

	.benefit-tag span {
		font-size: 1rem;
		font-weight: 500;
	}

	/* Mobile Section */
	.mobile-section {
		padding: 5rem 1rem;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.mobile-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(106, 90, 205, 0.3), transparent);
	}

	.mobile-content {
		max-width: 800px;
		margin: 0 auto;
		background: linear-gradient(135deg, rgba(22, 22, 45, 0.7) 0%, rgba(28, 28, 55, 0.6) 100%);
		padding: 3rem 2rem;
		border-radius: 16px;
		box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(123, 104, 238, 0.15);
		backdrop-filter: blur(5px);
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
		color: var(--icon-primary);
		text-shadow: 0 0 15px rgba(106, 90, 205, 0.4);
	}

	.platform span {
		font-weight: 600;
		font-size: 1.2rem;
		color: var(--text-primary);
	}

	.mobile-feature {
		font-size: 1.1rem;
		color: var(--text-secondary);
		margin-top: 2rem;
	}

	/* CTA Section */
	.cta-section {
		padding: 5rem 1rem;
		background: linear-gradient(135deg, rgba(72, 61, 139, 0.9) 0%, rgba(106, 90, 205, 0.8) 100%);
		color: var(--text-primary);
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.cta-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
	}

	.cta-content {
		max-width: 800px;
		margin: 0 auto;
		position: relative;
		z-index: 1;
	}

	.cta-content h2 {
		font-size: clamp(2rem, 4vw, 2.8rem);
		margin-bottom: 1.5rem;
		color: var(--text-primary);
		text-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
	}

	.cta-content p {
		font-size: 1.2rem;
		margin-bottom: 2.5rem;
		color: var(--text-secondary);
	}

	.cta-section .button.primary {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(220, 220, 220, 0.8) 100%);
		color: #0a0a20;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		border: none;
	}

	.cta-section .button.primary:hover {
		background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(240, 240, 240, 0.9) 100%);
		box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
	}

	/* Scroll Indicator */
	.scroll-indicator {
		display: none; /* Hide instead of removing completely to avoid any potential references */
	}

	.scroll-arrow {
		display: none;
	}

	.scroll-text {
		display: none;
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
		.video-wrapper {
			min-height: 350px;
		}

		.hero-content {
			padding: 1.5rem;
			justify-content: center;
			padding-top: 0;
		}

		.hero-text {
			margin-bottom: 2rem;
		}

		.hero-content h1 {
			margin-bottom: 1rem;
			font-size: clamp(3rem, 10vw, 4.5rem);
		}

		.small-title {
			font-size: clamp(1rem, 3vw, 1.3rem);
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
			display: none;
		}

		.scroll-arrow {
			display: none;
		}

		.scroll-text {
			display: none;
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

	@media (max-width: 900px) {
		.orb-container {
			flex-direction: column;
			text-align: center;
			gap: 2rem;
		}

		.orb-content h2 {
			text-align: center;
		}

		.orb-content h2::after {
			left: 50%;
			transform: translateX(-50%);
		}
	}

	.centered-title {
		text-align: center;
		display: block;
	}

	.centered-title::after {
		left: 50%;
		transform: translateX(-50%);
	}
</style>
