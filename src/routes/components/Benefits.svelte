<script lang="ts">
	import Section from './shared/Section.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let isVisible = false;
	let section: HTMLElement;

	const benefits = [
		{
			icon: 'brain',
			text: 'Expert-crafted content personalised to your unique needs'
		},
		{
			icon: 'palette',
			text: 'Beautiful, responsive design that works on all your devices'
		},
		{
			icon: 'lock',
			text: 'Secure user profiles with enterprise-grade data protection'
		},
		{
			icon: 'seedling',
			text: 'Adaptive learning system that grows with your practice'
		},
		{
			icon: 'moon',
			text: 'Specialised sessions for sleep, focus, anxiety, and more'
		},
		{
			icon: 'heart',
			text: 'Science-backed approach to mental wellbeing'
		}
	];

	onMount(() => {
		if (browser && 'IntersectionObserver' in window) {
			const observer = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting) {
						isVisible = true;
						observer.disconnect();
					}
				},
				{ threshold: 0.2 }
			);

			if (section) {
				observer.observe(section);
			}

			return () => {
				if (section) observer.unobserve(section);
			};
		}
	});
</script>

<div bind:this={section}>
	<Section title="Why Choose In The Moment?" centered={true} padding="medium">
		<div class="benefits-grid {isVisible ? 'visible' : ''}">
			{#each benefits as benefit, i}
				<div class="benefit-card" style="--delay: {i * 0.1}s">
					<div class="benefit-icon">
						<i class="fas fa-{benefit.icon}"></i>
					</div>
					<p>{benefit.text}</p>
				</div>
			{/each}
		</div>

		<div class="quote-container">
			<blockquote>
				"Mindfulness means paying attention in a particular way: on purpose, in the present moment,
				and non-judgmentally."
			</blockquote>
			<cite>— Jon Kabat-Zinn, Ph.D.</cite>
		</div>
	</Section>
</div>

<style>
	.benefits-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
		margin: 3rem 0;
	}

	.benefit-card {
		background: linear-gradient(135deg, rgba(20, 20, 40, 0.5) 0%, rgba(30, 30, 60, 0.5) 100%);
		padding: 1.5rem;
		border-radius: 12px;
		display: flex;
		align-items: center;
		gap: 1rem;
		border: 1px solid rgba(123, 104, 238, 0.15);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
		transition: all 0.4s ease;
		transform: translateY(20px);
		opacity: 0;
		position: relative;
		z-index: 1;
		overflow: hidden;
	}

	.benefit-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			135deg,
			rgba(123, 104, 238, 0.1) 0%,
			rgba(147, 112, 219, 0.05) 100%
		);
		opacity: 0;
		z-index: -1;
		transition: opacity 0.4s ease;
	}

	.benefits-grid.visible .benefit-card {
		transform: translateY(0);
		opacity: 1;
		transition-delay: var(--delay);
	}

	.benefit-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
		border-color: rgba(123, 104, 238, 0.3);
	}

	.benefit-card:hover::before {
		opacity: 1;
	}

	.benefit-icon {
		width: 45px;
		height: 45px;
		min-width: 45px;
		border-radius: 10px;
		background: linear-gradient(135deg, #7b68ee 0%, #9370db 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 1.2rem;
		box-shadow: 0 5px 15px rgba(123, 104, 238, 0.2);
	}

	.benefit-card p {
		margin: 0;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.5;
	}

	.quote-container {
		margin: 4rem auto 1rem;
		max-width: 800px;
		text-align: center;
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.6s ease;
		transition-delay: 0.8s;
	}

	.benefits-grid.visible + .quote-container {
		opacity: 1;
		transform: translateY(0);
	}

	blockquote {
		position: relative;
		font-size: clamp(1.2rem, 2.5vw, 1.6rem);
		color: white;
		font-style: italic;
		line-height: 1.6;
		margin: 0 0 1rem 0;
		padding: 0 2rem;
	}

	blockquote::before,
	blockquote::after {
		content: '"';
		font-family: Georgia, serif;
		font-size: 3rem;
		color: rgba(123, 104, 238, 0.5);
		position: absolute;
	}

	blockquote::before {
		top: -15px;
		left: 0;
	}

	blockquote::after {
		bottom: -35px;
		right: 0;
	}

	cite {
		color: rgba(255, 255, 255, 0.7);
		font-style: normal;
		font-size: 1rem;
	}

	@media (max-width: 768px) {
		.benefits-grid {
			grid-template-columns: 1fr;
		}

		blockquote {
			padding: 0 1.5rem;
			font-size: 1.2rem;
		}
	}
</style>
