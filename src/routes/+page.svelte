<script>
	import { onMount } from 'svelte';

	let canvas;
	let visualizer = null;
	let rendering = false;
	let audioContext = null;
	let sourceNode = null;
	let presets = {};

	function startRenderer() {
		requestAnimationFrame(() => startRenderer());
		if (visualizer) {
			visualizer.render();
		}
	}

	function createSilentAudio() {
		if (!audioContext || !visualizer) return;

		try {
			const bufferSize = audioContext.sampleRate * 2; // 2 seconds of silence
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
				rendering = true;
				startRenderer();
			}
		} catch (error) {
			console.error('Error creating silent audio:', error);
		}
	}

	function resizeCanvas() {
		if (!canvas) return;

		try {
			const width = window.innerWidth;
			const height = Math.min(window.innerHeight * 0.8, 800); // Limit height
			canvas.width = width;
			canvas.height = height;
			if (visualizer) {
				visualizer.setRendererSize(width, height);
			}
		} catch (error) {
			console.error('Error resizing canvas:', error);
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
			// Create audio context
			audioContext = new AudioContext();

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
			console.log('Available presets:', presetKeys.length);

			if (presetKeys.length === 0) {
				console.error('No presets available');
				return;
			}

			// Create visualizer
			visualizer = window.butterchurn.default.createVisualizer(audioContext, canvas, {
				width: canvas.width,
				height: canvas.height,
				pixelRatio: window.devicePixelRatio || 1,
				textureRatio: 1
			});

			// Select preset
			let presetKey;
			console.log('Preset keys:', presetKeys);
			if (presetKeys.length > 60) {
				presetKey = presetKeys[22]; // 60 light, 22 dark
			} else {
				const randomIndex = Math.floor(Math.random() * presetKeys.length);
				presetKey = presetKeys[randomIndex];
			}

			console.log('Loading preset:', presetKey);
			visualizer.loadPreset(presets[presetKey], 0);

			// Start audio and rendering
			createSilentAudio();
		} catch (error) {
			console.error('Error initializing visualizer:', error);
		}
	}

	onMount(() => {
		// Add resize event listener
		window.addEventListener('resize', resizeCanvas);

		// Initialize canvas size
		resizeCanvas();

		// Initialize visualizer after scripts are loaded
		const initTimeout = setTimeout(() => {
			console.log('Initializing visualizer...');
			initVisualizer();
		}, 500);

		return () => {
			// Clean up on component unmount
			clearTimeout(initTimeout);
			window.removeEventListener('resize', resizeCanvas);
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
	<link
		href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@300;400;700&display=swap"
		rel="stylesheet"
	/>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
	<!-- Butterchurn dependencies -->
	<script
		type="text/javascript"
		src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"
	></script>
	<script
		type="text/javascript"
		src="https://unpkg.com/butterchurn@2.6.7/lib/butterchurn.min.js"
	></script>
	<script
		type="text/javascript"
		src="https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresets.min.js"
	></script>
	<script
		type="text/javascript"
		src="https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresetsExtra.min.js"
	></script>
</svelte:head>

<section class="hero-container">
	<div class="visualizer-wrapper">
		<canvas bind:this={canvas} class="visualizer-canvas"></canvas>
		<div class="hero-content">
			<div class="hero-text">
				<h1>Live In The Moment</h1>
				<p class="tagline">
					Experience bespoke mindfulness journeys crafted by cutting-edge artificial intelligence
				</p>
			</div>
			<div class="cta">
				<a href="/register" class="button primary">Sign Up Now</a>
				<a href="/login" class="button secondary">Welcome Back</a>
			</div>
		</div>
	</div>
</section>

<div class="content-wrapper">
	<main class="global-container">
		<section class="features">
			<div class="feature">
				<span class="icon"><i class="fas fa-brain"></i></span>
				<h2>Personalised AI Guidance</h2>
				<p>
					Our advanced AI analyses your preferences, stress levels, and goals to create truly unique
					meditation experiences
				</p>
			</div>
			<div class="feature">
				<span class="icon"><i class="fas fa-music"></i></span>
				<h2>Immersive Audio</h2>
				<p>
					Enjoy crystal-clear guided meditations with dynamic soundscapes and soothing
					visualisations
				</p>
			</div>
			<div class="feature">
				<span class="icon"><i class="fas fa-chart-line"></i></span>
				<h2>Progress Tracking</h2>
				<p>Visualise your mindfulness journey with detailed insights and achievement milestones</p>
			</div>
		</section>

		<section class="how-it-works">
			<h2>How In The Moment Works</h2>
			<div class="steps">
				<div class="step">
					<span class="step-number">1</span>
					<h3>Profile Creation</h3>
					<p>Answer a few questions about your meditation goals and preferences</p>
				</div>
				<div class="step">
					<span class="step-number">2</span>
					<h3>AI Generation</h3>
					<p>Our AI crafts a personalised meditation script and selects appropriate audio</p>
				</div>
				<div class="step">
					<span class="step-number">3</span>
					<h3>Immersive Experience</h3>
					<p>Listen to your custom meditation with our interactive audio player</p>
				</div>
				<div class="step">
					<span class="step-number">4</span>
					<h3>Continuous Improvement</h3>
					<p>Provide feedback to refine future sessions and track your progress</p>
				</div>
			</div>
		</section>

		<section class="features-highlight">
			<h2>Why Choose In The Moment?</h2>
			<div class="highlight-grid">
				<div class="highlight-item">
					<i class="fas fa-brain"></i> Cutting-edge AI technology for truly personalised experiences
				</div>
				<div class="highlight-item">
					<i class="fas fa-palette"></i> Beautiful, responsive design that works on all your devices
				</div>
				<div class="highlight-item">
					<i class="fas fa-lock"></i> Secure user profiles and data protection
				</div>
				<div class="highlight-item">
					<i class="fas fa-seedling"></i> Continuous learning algorithm that grows with you
				</div>
			</div>
		</section>

		<section class="mobile-apps">
			<h2>Take In The Moment Everywhere</h2>
			<p class="coming-soon">Native mobile apps for Android and iOS coming soon!</p>
			<div class="app-icons">
				<div class="app-icon">
					<i class="fab fa-android"></i>
					<span>Android</span>
				</div>
				<div class="app-icon">
					<i class="fab fa-apple"></i>
					<span>iOS</span>
				</div>
			</div>
			<p class="offline-support">
				Enjoy offline support for uninterrupted meditation, anywhere you go
			</p>
		</section>

		<section class="final-cta">
			<h2>Ready to Transform Your Mindfulness Practice?</h2>
			<p>Join users who have discovered the power of AI-driven meditation</p>
			<a href="/register" class="button primary">Sign Up Now</a>
		</section>
	</main>
</div>

<style>
	main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
		text-align: center;
		color: #333;
	}

	.content-wrapper {
		width: 100%;
		margin: 0 auto;
		padding-top: 4rem;
	}

	h1,
	h2 {
		font-family: 'Poppins', sans-serif;
	}

	.hero-container {
		margin-bottom: 0;
		overflow: hidden;
		width: 100%;
		position: relative;
	}

	.visualizer-wrapper {
		position: relative;
		width: 100vw;
		height: 100vh;
		max-height: 100vh;
		min-height: 500px;
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
		background-color: #000; /* Add a black background to ensure visibility */
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
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
		background: rgba(0, 0, 0, 0.1); /* Slightly darker overlay for better contrast */
	}

	.hero-text {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-bottom: 2rem;
		max-width: 1200px;
		width: 100%;
	}

	.hero-content h1 {
		font-size: clamp(2.5rem, 5vw, 4rem);
		margin-bottom: 1.5rem;
		text-align: center;
		line-height: 1.2;
		width: 100%;
		max-width: 1200px;
	}

	.tagline {
		font-size: clamp(1.1rem, 2vw, 1.4rem);
		margin-bottom: 0;
		color: white;
		max-width: 800px;
		text-align: center;
		line-height: 1.5;
		width: 100%;
	}

	.cta {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.5rem;
		width: 100%;
		max-width: 600px;
	}

	.features {
		display: flex;
		justify-content: space-between;
		margin-bottom: 4rem;
		gap: 2rem;
	}

	.feature {
		flex: 1;
		padding: 2rem;
		background-color: #fff;
		border-radius: 12px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
		transition: transform 0.3s ease;
	}

	.feature:hover {
		transform: translateY(-5px);
	}

	.icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		display: block;
	}

	.feature h2 {
		font-size: 1.8rem;
		color: #333;
		margin-bottom: 1rem;
	}

	.feature p {
		font-size: 1.1rem;
		color: #555;
	}

	.final-cta {
		background-color: #f5f5f5;
		color: #333;
		padding: 3rem;
		border-radius: 12px;
	}

	.final-cta h2 {
		font-size: 2.5rem;
		margin-bottom: 1.5rem;
	}

	.button {
		display: inline-block;
		padding: 1rem 2rem;
		font-size: 1.1rem;
		text-decoration: none;
		color: #333;
		background-color: #fff;
		border: 2px solid #333;
		border-radius: 50px;
		transition: all 0.3s ease;
		font-weight: bold;
		min-width: 200px;
		box-sizing: border-box;
		text-align: center;
	}

	.button:hover {
		background-color: #f0f0f0;
		transform: translateY(-2px);
	}

	.button.primary {
		background-color: #000;
		color: #fff;
	}

	.button.primary:hover {
		background-color: #444;
	}

	.button.secondary {
		background-color: transparent;
		color: white;
		border-color: white;
	}

	.button.secondary:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	@media (max-width: 1024px) {
		main {
			padding: 2rem 1rem;
		}

		.features {
			flex-direction: column;
			align-items: center;
		}

		.feature {
			width: 100%;
			max-width: 500px;
			margin-bottom: 2rem;
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
	}

	@media (max-width: 600px) {
		.content-wrapper {
			padding-top: 3rem;
		}

		.hero-container {
			margin-bottom: 0;
		}

		.visualizer-wrapper {
			min-height: 400px;
			margin-left: -50vw;
			margin-right: -50vw;
			width: 100vw;
		}

		.hero-content {
			padding: 1.5rem;
			justify-content: center;
		}

		.hero-text {
			margin-bottom: 1.5rem;
		}

		.hero-content h1 {
			margin-bottom: 1rem;
			font-size: clamp(2rem, 8vw, 2.5rem);
		}

		.tagline {
			font-size: clamp(1rem, 4vw, 1.2rem);
			padding: 0;
		}

		.cta {
			flex-direction: column;
			width: 100%;
			max-width: 300px;
			gap: 1rem;
			padding: 0;
		}

		.features {
			flex-direction: column;
		}

		.feature {
			width: 100%;
			margin-bottom: 1rem;
		}

		.final-cta {
			padding: 2rem 1rem;
		}

		.final-cta h2 {
			font-size: 2rem;
		}

		.button {
			width: 100%;
			max-width: 100%;
			margin: 0 auto;
			display: block;
			min-width: unset;
			padding: 1rem 1rem;
		}
	}

	@media (min-width: 601px) {
		.features,
		.final-cta {
			padding-left: 2rem;
			padding-right: 2rem;
		}
	}

	@media (max-width: 600px) {
		.features,
		.final-cta {
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}

	/* For very small screens */
	@media (max-width: 350px) {
		.hero-content h1 {
			font-size: 1.8rem;
		}

		.tagline {
			font-size: 0.95rem;
		}

		.button {
			padding: 0.8rem 1.5rem;
			font-size: 1rem;
		}
	}

	.how-it-works {
		margin-bottom: 4rem;
	}

	.steps {
		display: flex;
		justify-content: space-between;
		gap: 2rem;
		margin-top: 2rem;
	}

	.step {
		flex: 1;
		text-align: center;
		padding: 1rem;
		background-color: #f9f9f9;
		border-radius: 12px;
	}

	.step-number {
		display: inline-block;
		width: 30px;
		height: 30px;
		line-height: 30px;
		background-color: #333;
		color: #fff;
		border-radius: 50%;
		margin-bottom: 1rem;
	}

	.features-highlight {
		margin-bottom: 4rem;
	}

	.highlight-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-top: 2rem;
	}

	.highlight-item {
		background-color: #f9f9f9;
		padding: 1.5rem;
		border-radius: 12px;
		font-size: 1.1rem;
		text-align: left;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}

	.highlight-item:hover {
		transform: translateY(-5px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	@media (max-width: 768px) {
		.steps {
			flex-direction: column;
		}

		.highlight-grid {
			grid-template-columns: 1fr;
		}
	}

	.mobile-apps {
		background-color: #f9f9f9;
		padding: 4rem 2rem;
		border-radius: 12px;
		margin-bottom: 4rem;
		text-align: center;
	}

	.mobile-apps h2 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	.coming-soon {
		font-size: 1.2rem;
		color: #555;
		margin-bottom: 2rem;
	}

	.app-icons {
		display: flex;
		justify-content: center;
		gap: 3rem;
		margin-bottom: 2rem;
	}

	.app-icon {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.app-icon i {
		font-size: 4rem;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.app-icon span {
		font-weight: bold;
		color: #333;
	}

	.offline-support {
		font-size: 1.1rem;
		color: #555;
		margin-top: 1rem;
	}

	@media (max-width: 600px) {
		.mobile-apps {
			padding: 2rem 1rem;
		}

		.mobile-apps h2 {
			font-size: 2rem;
		}

		.app-icons {
			gap: 2rem;
		}

		.app-icon i {
			font-size: 3rem;
		}
	}
</style>
