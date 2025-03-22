<script lang="ts">
	import { onMount } from 'svelte';
	import Button from './shared/Button.svelte';
	import { browser } from '$app/environment';
	import HeroAnimation from './HeroAnimation.svelte';

	let heroSection: HTMLElement;
	let loaded = false;
	let isMindfulnessActive = false;
	let toggleButton: HTMLButtonElement;
	let toggleCenter = { x: 0, y: 0 };

	// Create a ripple effect at the toggle button
	function createRippleEffect(button: HTMLElement) {
		const ripple = document.createElement('span');
		ripple.classList.add('ripple');
		button.appendChild(ripple);

		setTimeout(() => {
			ripple.remove();
		}, 1000);
	}

	// Update toggle state
	function toggleMindfulness() {
		isMindfulnessActive = !isMindfulnessActive;

		if (toggleButton) {
			// Update the button appearance
			if (isMindfulnessActive) {
				toggleButton.classList.add('active');
				toggleButton.querySelector('.toggle-state')!.textContent = 'ON';

				// Add a ripple effect
				createRippleEffect(toggleButton);

				// Add glow effect to button and change background
				toggleButton.style.boxShadow = '0 0 20px rgba(123, 104, 238, 0.6)';
				if (heroSection) {
					heroSection.classList.add('mindful');
				}
			} else {
				toggleButton.classList.remove('active');
				toggleButton.querySelector('.toggle-state')!.textContent = 'OFF';

				// Reset button appearance
				toggleButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
				if (heroSection) {
					heroSection.classList.remove('mindful');
				}
			}

			// Calculate the center of the toggle button for animation
			const rect = toggleButton.getBoundingClientRect();
			toggleCenter = {
				x: rect.left + rect.width / 2,
				y: rect.top + rect.height / 2
			};
		}
	}

	onMount(() => {
		if (browser) {
			loaded = true;

			// 3D tilt effect for hero content
			const heroContent = document.querySelector('.hero-content') as HTMLElement;
			if (heroContent) {
				heroContent.addEventListener('mousemove', (e) => {
					const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
					const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
					heroContent.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
				});

				heroContent.addEventListener('mouseleave', () => {
					heroContent.style.transform = 'rotateY(0deg) rotateX(0deg)';
				});
			}
		}
	});
</script>

<section
	class="hero {loaded ? 'loaded' : ''}"
	class:mindful={isMindfulnessActive}
	bind:this={heroSection}
>
	<HeroAnimation {isMindfulnessActive} {toggleCenter} />

	<div class="mindfulness-toggle">
		<button class="toggle-button" bind:this={toggleButton} on:click={toggleMindfulness}>
			<span class="toggle-icon">
				<i class="fas fa-brain"></i>
			</span>
			<span class="toggle-label">Mindfulness</span>
			<span class="toggle-state">OFF</span>
		</button>
	</div>

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
				<Button href="/register" variant="primary" size="large">Begin Your Journey</Button>
				<div class="login-link">
					<div class="login-button">
						<i class="fa-solid fa-arrow-right-to-arc"></i>
					</div>
					<span>Login</span>
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
		transition: background 1.5s ease;
		width: 100%;
		padding: 2rem 0;
	}

	.hero.mindful {
		background: linear-gradient(135deg, #0f1a29 0%, #2f3c63 50%, #243a4e 100%);
	}

	.hero.mindful .toggle-button {
		box-shadow: 0 0 30px rgba(123, 104, 238, 0.7);
	}

	.mindfulness-toggle {
		position: absolute;
		top: 2rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10;
	}

	.toggle-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 30px;
		color: white;
		padding: 0.6rem 1.5rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		backdrop-filter: blur(10px);
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		position: relative;
		overflow: hidden;
	}

	.ripple {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 0;
		height: 0;
		border-radius: 50%;
		background: rgba(123, 104, 238, 0.4);
		animation: ripple-animation 1s ease-out;
	}

	@keyframes ripple-animation {
		0% {
			width: 0;
			height: 0;
			opacity: 0.8;
		}
		100% {
			width: 200px;
			height: 200px;
			opacity: 0;
		}
	}

	.toggle-button:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
	}

	.toggle-button.active {
		background: rgba(123, 104, 238, 0.3);
		border-color: rgba(123, 104, 238, 0.5);
	}

	.toggle-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		color: #9370db;
		font-size: 1.1rem;
	}

	.toggle-button.active .toggle-icon {
		color: white;
	}

	.toggle-label {
		letter-spacing: 0.5px;
		font-family: 'Poppins', sans-serif;
	}

	.toggle-state {
		font-size: 0.8rem;
		font-weight: 700;
		background: rgba(255, 255, 255, 0.15);
		padding: 0.2rem 0.5rem;
		border-radius: 10px;
		letter-spacing: 0.5px;
	}

	.toggle-button.active .toggle-state {
		background: rgba(255, 255, 255, 0.25);
		content: 'ON';
	}

	.hero-3d-container {
		position: relative;
		z-index: 3;
		max-width: 1200px;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 2rem;
		transition: transform 0.6s ease;
	}

	.hero-content {
		transition: transform 0.6s ease;
		transform-style: preserve-3d;
		max-width: 800px;
		width: 100%;
		opacity: 0;
		transform: translateY(40px);
		animation: fadeIn 1s forwards 0.5s;
	}

	@keyframes fadeIn {
		to {
			opacity: 1;
			transform: translateY(0);
		}
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

	.login-link {
		display: flex;
		align-items: center;
		gap: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
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
		transition: all 0.3s ease;
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
		opacity: 0;
		animation: fadeIn 1s forwards 1.2s;
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

		.mindfulness-toggle {
			top: 1rem;
		}

		.hero-cta {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.5rem;
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
			padding: 3rem 0 4rem;
			justify-content: flex-start;
		}

		.mindfulness-toggle {
			top: rem;
			width: 100%;
			display: flex;
			justify-content: center;
		}

		.toggle-button {
			padding: 0.5rem 1.2rem;
			font-size: 0.9rem;
		}

		.toggle-icon {
			width: 24px;
			height: 24px;
		}

		.hero-3d-container {
			padding: 0 1rem;
			margin-top: 1rem;
		}

		.hero-content {
			text-align: center;
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
			align-items: center;
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
</style>
