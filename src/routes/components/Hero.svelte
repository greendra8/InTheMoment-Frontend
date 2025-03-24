<script lang="ts">
	import { onMount } from 'svelte';
	import Button from './shared/Button.svelte';
	import { browser } from '$app/environment';

	let heroSection: HTMLElement;
	let loaded = false;
	let isMobile = false;
	let imageLoaded = true;

	// Background image (optional)
	export let backgroundImage: string | undefined = undefined;
	// Mobile background image (optional)
	export let mobileBackgroundImage: string | undefined = undefined;
	// Server-provided initial image
	export let initialImage: string;
	// Server-detected mobile state
	export let serverIsMobile: boolean;

	// Start with the server-provided image
	let currentBackgroundImage = initialImage;

	onMount(() => {
		if (browser) {
			loaded = true;

			// Simple media query check for mobile devices
			const mediaQuery = window.matchMedia('(max-width: 768px)');

			// Only update if the client-side detection differs from server
			if (mediaQuery.matches !== serverIsMobile) {
				isMobile = mediaQuery.matches;
				currentBackgroundImage =
					isMobile && mobileBackgroundImage
						? mobileBackgroundImage
						: backgroundImage
							? backgroundImage
							: initialImage;
			}

			// Add listener for changes
			const handleMediaChange = (e: MediaQueryListEvent) => {
				isMobile = e.matches;
				currentBackgroundImage =
					isMobile && mobileBackgroundImage
						? mobileBackgroundImage
						: backgroundImage
							? backgroundImage
							: initialImage;
			};

			mediaQuery.addEventListener('change', handleMediaChange);

			return () => {
				mediaQuery.removeEventListener('change', handleMediaChange);
			};
		}
	});
</script>

<section
	class="hero {loaded ? 'loaded' : ''}"
	class:image-loaded={imageLoaded}
	bind:this={heroSection}
>
	{#if currentBackgroundImage}
		<div class="hero-background" style={`background-image: url(${currentBackgroundImage});`}></div>
	{/if}

	<div class="hero-3d-container">
		<div class="hero-content">
			<div class="hero-badge">New AI-Powered Platform</div>
			<h1>
				<span class="gradient-text">Mindfulness</span>
				<span>for the</span>
				<span class="accent-text">Digital Age</span>
			</h1>

			<p class="hero-description">
				Experience personalized meditation journeys that adapt to your unique needs, helping you
				break free from digital overwhelm and rediscover tranquility
			</p>

			<div class="hero-cta">
				<div class="cta-button-container">
					<div class="cta-glow"></div>
					<Button href="/register" variant="primary" size="large">Begin Your Journey</Button>
				</div>
				<div class="login-link">
					<a href="/login" class="login-link-anchor">
						<div class="login-button">
							<i class="fa-solid fa-arrow-right-to-arc"></i>
						</div>
						<span>Login</span>
					</a>
				</div>
			</div>

			<div class="hero-stats">
				<div class="stat">
					<div class="stat-number">10K+</div>
					<div class="stat-label">Active Users</div>
				</div>
				<div class="stat-divider"></div>
				<div class="stat">
					<div class="stat-number">98%</div>
					<div class="stat-label">Satisfaction</div>
				</div>
				<div class="stat-divider"></div>
				<div class="stat">
					<div class="stat-number">4.9</div>
					<div class="stat-label">App Rating</div>
				</div>
			</div>
		</div>
	</div>

	<div class="scroll-indicator">
		<div class="mouse">
			<div class="wheel"></div>
		</div>
		<div class="scroll-text">Scroll to explore</div>
	</div>
</section>

<style>
	.hero {
		min-height: 100vh;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
		overflow: hidden;
		perspective: 1000px;
		width: 100%;
		padding: 2rem 0;
	}

	.hero-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		z-index: 0;
	}

	.hero-background::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(15, 12, 41, 0.5);
	}

	.hero-3d-container,
	.scroll-indicator {
		position: relative;
		z-index: 2;
	}

	.hero-3d-container {
		max-width: 1200px;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 2rem;
		transition: none;
	}

	.hero-content {
		transition: none;
		transform-style: preserve-3d;
		max-width: 800px;
		width: 100%;
		opacity: 1;
		transform: translateY(0);
		filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.1));
	}

	.hero-badge {
		display: inline-block;
		background: rgba(123, 104, 238, 0.2);
		color: #9370db;
		font-size: 0.9rem;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		margin-bottom: 1.5rem;
		border: 1px solid rgba(123, 104, 238, 0.3);
		backdrop-filter: blur(10px);
		letter-spacing: 0.05em;
	}

	h1 {
		font-size: clamp(3rem, 8vw, 4.5rem);
		margin-bottom: 1.5rem;
		line-height: 1.1;
		font-weight: 700;
		font-family: 'Poppins', sans-serif;
		display: flex;
		flex-direction: column;
	}

	.gradient-text {
		background: linear-gradient(135deg, #7b68ee, #9370db);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		display: inline-block;
		text-shadow: none;
	}

	.accent-text {
		color: #fff;
		margin-top: 0.3rem;
	}

	.hero-description {
		font-size: clamp(1.1rem, 2vw, 1.3rem);
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.6;
		margin-bottom: 3rem;
		max-width: 700px;
	}

	.hero-cta {
		display: flex;
		align-items: center;
		margin-bottom: 4rem;
		gap: 2rem;
	}

	.cta-button-container {
		position: relative;
		z-index: 1;
	}

	.cta-glow {
		position: absolute;
		width: 100%;
		height: 100%;
		background: radial-gradient(circle, rgba(123, 104, 238, 0.6) 0%, rgba(123, 104, 238, 0) 70%);
		filter: blur(15px);
		z-index: -1;
		transform: scale(1.2);
		animation: glow-pulse 3s ease-in-out infinite;
	}

	@keyframes glow-pulse {
		0% {
			opacity: 0.5;
			transform: scale(1.2);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.4);
		}
		100% {
			opacity: 0.5;
			transform: scale(1.2);
		}
	}

	.login-link {
		display: flex;
		align-items: center;
		gap: 1rem;
		cursor: pointer;
		transition: transform 0.2s ease-in-out;
	}

	.login-link-anchor {
		display: flex;
		align-items: center;
		gap: 1rem;
		text-decoration: none;
	}

	.login-link:hover {
		transform: translateY(-2px);
	}

	.login-button {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
		transition: none;
	}

	.login-link:hover .login-button {
		background: rgba(123, 104, 238, 0.2);
		border-color: rgba(123, 104, 238, 0.4);
	}

	.login-link span {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
	}

	.hero-stats {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 1.5rem 2rem;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.stat {
		flex: 1;
		text-align: center;
	}

	.stat-number {
		font-size: 1.8rem;
		font-weight: 700;
		color: white;
		margin-bottom: 0.3rem;
		font-family: 'Poppins', sans-serif;
	}

	.stat-label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.stat-divider {
		width: 1px;
		height: 40px;
		background: rgba(255, 255, 255, 0.2);
	}

	.scroll-indicator {
		position: absolute;
		bottom: 3rem;
		left: 0;
		right: 0;
		margin: 0 auto;
		width: fit-content;
		z-index: 4;
		display: flex;
		flex-direction: column;
		align-items: center;
		opacity: 1;
	}

	.mouse {
		width: 26px;
		height: 40px;
		border: 2px solid rgba(255, 255, 255, 0.5);
		border-radius: 20px;
		position: relative;
		margin-bottom: 0.8rem;
	}

	.wheel {
		position: absolute;
		width: 4px;
		height: 8px;
		background: rgba(255, 255, 255, 0.7);
		left: 50%;
		top: 6px;
		transform: translateX(-50%);
		border-radius: 4px;
		animation: scroll 2s infinite;
	}

	@keyframes scroll {
		0% {
			transform: translateX(-50%) translateY(0);
			opacity: 1;
		}
		100% {
			transform: translateX(-50%) translateY(15px);
			opacity: 0;
		}
	}

	.scroll-text {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9rem;
	}

	@media (max-width: 768px) {
		.hero {
			padding: 6rem 0 6rem;
		}

		/* Apply mobile background image if specified */
		.hero[style*='background-image'] {
			background-position: center;
		}

		.hero-cta {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.5rem;
		}

		.cta-button-container {
			width: 100%;
		}

		.hero-stats {
			flex-direction: column;
			gap: 1.5rem;
			padding: 1.5rem;
			margin-bottom: 3rem;
		}

		.stat-divider {
			width: 80%;
			height: 1px;
		}

		.scroll-indicator {
			bottom: 1rem;
		}

		.hero-3d-container {
			padding: 0 1.5rem;
		}
	}

	@media (max-width: 480px) {
		.hero {
			padding: 0 0 4rem;
			justify-content: flex-start;
		}

		.hero-3d-container {
			padding: 0 1rem;
			margin-top: 1rem;
		}

		.hero-content {
			padding: 0;
			transform-style: flat;
		}

		.hero-description {
			font-size: 1rem;
			margin-bottom: 2rem;
		}

		.hero-badge {
			margin-left: auto;
			margin-right: auto;
			margin-top: 2rem;
			margin-bottom: 0.5rem;
			font-size: 0.8rem;
			padding: 0.4rem 0.8rem;
		}

		.hero-cta {
			margin-bottom: 2.5rem;
			gap: 1.2rem;
		}

		.login-link {
			transform: scale(0.9);
		}

		.hero-stats {
			padding: 1.2rem;
			margin-bottom: 5rem;
		}

		.stat-number {
			font-size: 1.5rem;
		}

		.stat-label {
			font-size: 0.8rem;
		}

		.scroll-indicator {
			bottom: 2rem;
		}

		.mouse {
			width: 22px;
			height: 34px;
		}

		.scroll-text {
			font-size: 0.8rem;
		}
	}

	@media (max-height: 835px) and (min-width: 768px) {
		.scroll-indicator {
			display: none;
		}
	}
</style>
