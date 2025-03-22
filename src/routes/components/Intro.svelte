<script lang="ts">
	import Section from './shared/Section.svelte';
	import Button from './shared/Button.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let isVisible = false;
	let introSection: HTMLElement;
	let cards: HTMLElement[] = [];

	// Parallax effect for cards
	function handleMouseMove(e: MouseEvent, card: HTMLElement) {
		const rect = card.getBoundingClientRect();
		const x = e.clientX - rect.left; // x position within the card
		const y = e.clientY - rect.top; // y position within the card

		// Calculate rotation based on mouse position
		const xRotation = 10 * ((y - rect.height / 2) / rect.height);
		const yRotation = -10 * ((x - rect.width / 2) / rect.width);

		// Apply transform
		card.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale3d(1.02, 1.02, 1.02)`;
	}

	function handleMouseLeave(card: HTMLElement) {
		card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
	}

	// Intersection Observer to trigger animations when section is visible
	onMount(() => {
		if (browser && 'IntersectionObserver' in window) {
			const observer = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting) {
						isVisible = true;
						observer.disconnect();
					}
				},
				{ threshold: 0.3 }
			);

			if (introSection) {
				observer.observe(introSection);
			}

			// Add event listeners for 3D hover effect on cards
			const cardElements = document.querySelectorAll('.benefit-card');
			cardElements.forEach((card) => {
				const typedCard = card as HTMLElement;
				cards.push(typedCard);

				typedCard.addEventListener('mousemove', (e) => handleMouseMove(e, typedCard));
				typedCard.addEventListener('mouseleave', () => handleMouseLeave(typedCard));
			});

			return () => {
				if (introSection) observer.unobserve(introSection);

				// Clean up event listeners
				cards.forEach((card) => {
					card.removeEventListener('mousemove', (e) => handleMouseMove(e, card));
					card.removeEventListener('mouseleave', () => handleMouseLeave(card));
				});
			};
		}
	});

	const benefits = [
		{
			icon: 'brain',
			title: 'Stress Reduction',
			description: 'Lower cortisol levels and reduced anxiety in just a few minutes per day'
		},
		{
			icon: 'eye',
			title: 'Improved Focus',
			description: 'Train your attention span and develop deeper concentration through mindfulness'
		},
		{
			icon: 'heart',
			title: 'Better Relationships',
			description: 'Develop emotional awareness and compassion that enhances your connections'
		},
		{
			icon: 'bed',
			title: 'Enhanced Sleep',
			description: 'Fall asleep faster and improve sleep quality with bedtime meditation routines'
		}
	];
</script>

<div bind:this={introSection}>
	<section class="intro-section {isVisible ? 'visible' : ''}">
		<div class="intro-content container">
			<div class="intro-left">
				<span class="intro-eyebrow">Reconnect with yourself</span>
				<h2 class="intro-title">
					The Science of <span class="highlight">Mindfulness</span> in Your Daily Life
				</h2>
				<p class="intro-description">
					In The Moment combines proven mindfulness techniques with AI technology to create
					personalized meditation experiences that fit perfectly into your busy schedule.
				</p>

				<div class="intro-stats">
					<div class="stat-item">
						<span class="stat-number">87%</span>
						<span class="stat-text">Report reduced stress within 14 days</span>
					</div>
					<div class="stat-item">
						<span class="stat-number">62%</span>
						<span class="stat-text">Improvement in focus and concentration</span>
					</div>
				</div>

				<div class="intro-action">
					<Button href="/benefits" variant="outline">Learn More About Benefits</Button>
				</div>
			</div>

			<div class="intro-right">
				<div class="benefit-cards">
					{#each benefits as benefit, i}
						<div class="benefit-card" style="--delay: {i * 0.1}s">
							<div class="card-header">
								<div class="benefit-icon">
									<i class="fas fa-{benefit.icon}"></i>
								</div>
								<h3>{benefit.title}</h3>
							</div>
							<p>{benefit.description}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="intro-shape shape-1"></div>
		<div class="intro-shape shape-2"></div>
	</section>
</div>

<style>
	.intro-section {
		padding: 8rem 2rem;
		position: relative;
		overflow: hidden;
		background: linear-gradient(45deg, rgba(15, 12, 41, 0.9) 0%, rgba(48, 43, 99, 0.9) 100%);
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		position: relative;
		z-index: 2;
	}

	.intro-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
	}

	.intro-left {
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.7s ease;
	}

	.intro-section.visible .intro-left {
		opacity: 1;
		transform: translateY(0);
	}

	.intro-eyebrow {
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: rgba(147, 112, 219, 0.9);
		font-weight: 500;
		display: block;
		margin-bottom: 1rem;
	}

	.intro-title {
		font-size: clamp(2rem, 5vw, 3.2rem);
		font-weight: 700;
		margin-bottom: 1.5rem;
		line-height: 1.2;
		color: white;
		font-family: 'Poppins', sans-serif;
	}

	.highlight {
		position: relative;
		display: inline-block;
		color: #9370db;
	}

	.highlight::after {
		content: '';
		position: absolute;
		bottom: 5px;
		left: 0;
		width: 100%;
		height: 8px;
		background: rgba(123, 104, 238, 0.3);
		z-index: -1;
		border-radius: 4px;
	}

	.intro-description {
		font-size: 1.1rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 2.5rem;
	}

	.intro-stats {
		display: flex;
		gap: 2rem;
		margin-bottom: 2.5rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
	}

	.stat-number {
		font-size: 2.5rem;
		font-weight: 700;
		color: #9370db;
		margin-bottom: 0.5rem;
		font-family: 'Poppins', sans-serif;
	}

	.stat-text {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
		max-width: 180px;
	}

	.intro-action {
		margin-top: 1rem;
	}

	.intro-right {
		position: relative;
		z-index: 2;
	}

	.benefit-cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		perspective: 1000px;
	}

	.benefit-card {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 16px;
		padding: 1.75rem;
		border: 1px solid rgba(123, 104, 238, 0.15);
		position: relative;
		overflow: hidden;
		transition: all 0.5s ease;
		opacity: 0;
		transform: translateY(30px) rotateX(10deg);
		transform-style: preserve-3d;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
		cursor: pointer;
	}

	.intro-section.visible .benefit-card {
		opacity: 1;
		transform: translateY(0) rotateX(0);
		transition-delay: var(--delay);
	}

	.card-header {
		display: flex;
		flex-direction: column;
		margin-bottom: 0.75rem;
	}

	.benefit-icon {
		width: 50px;
		height: 50px;
		min-width: 50px;
		border-radius: 12px;
		background: linear-gradient(135deg, rgba(123, 104, 238, 0.2), rgba(147, 112, 219, 0.2));
		display: flex;
		align-items: center;
		justify-content: center;
		color: #9370db;
		font-size: 1.25rem;
		position: relative;
		z-index: 2;
		border: 1px solid rgba(123, 104, 238, 0.3);
		margin-bottom: 0.75rem;
	}

	.benefit-card h3 {
		font-size: 1.3rem;
		font-weight: 600;
		margin: 0;
		color: white;
		position: relative;
		z-index: 2;
		font-family: 'Poppins', sans-serif;
	}

	.benefit-card p {
		font-size: 0.95rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.8);
		margin: 0;
		position: relative;
		z-index: 2;
	}

	.intro-shape {
		position: absolute;
		border-radius: 50%;
		filter: blur(60px);
		z-index: 1;
	}

	.shape-1 {
		width: 500px;
		height: 500px;
		background: rgba(123, 104, 238, 0.15);
		top: -200px;
		right: -200px;
	}

	.shape-2 {
		width: 400px;
		height: 400px;
		background: rgba(147, 112, 219, 0.15);
		bottom: -150px;
		left: -100px;
	}

	@media (max-width: 1024px) {
		.intro-content {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.stat-text {
			max-width: none;
		}

		.card-header {
			flex-direction: row;
			align-items: center;
			gap: 1rem;
		}

		.benefit-icon {
			margin-bottom: 0;
		}
	}

	@media (max-width: 768px) {
		.intro-section {
			padding: 6rem 1.5rem;
		}

		.benefit-cards {
			grid-template-columns: 1fr;
		}

		.intro-stats {
			flex-direction: column;
			gap: 1.5rem;
		}
	}

	@media (max-width: 480px) {
		.intro-section {
			padding: 5rem 1.25rem;
		}

		.intro-title {
			font-size: 2rem;
		}

		.intro-description {
			font-size: 1rem;
		}

		.stat-number {
			font-size: 2rem;
		}
	}
</style>
