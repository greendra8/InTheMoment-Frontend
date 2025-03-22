<script lang="ts">
	import Section from './shared/Section.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let isVisible = false;
	let section: HTMLElement;

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

	const steps = [
		{
			number: 1,
			title: 'Create Your Profile',
			description: 'Answer a few questions about your meditation goals and preferences',
			icon: 'user'
		},
		{
			number: 2,
			title: 'Custom Creation',
			description:
				'Our system crafts a personalised meditation script, spoken aloud by a comforting voice',
			icon: 'wand-magic-sparkles'
		},
		{
			number: 3,
			title: 'Immersive Experience',
			description: 'Listen to your custom meditation with our interactive audio player',
			icon: 'headphones'
		},
		{
			number: 4,
			title: 'Continuous Improvement',
			description: 'Provide feedback to refine future sessions and track your progress',
			icon: 'chart-simple'
		}
	];
</script>

<div bind:this={section}>
	<Section title="How It Works" centered={true} padding="medium">
		<div class="process {isVisible ? 'visible' : ''}">
			{#each steps as step, i}
				<div class="step-container">
					<div
						class="step-connector"
						class:first={i === 0}
						class:last={i === steps.length - 1}
					></div>
					<div class="step">
						<div class="step-number">{step.number}</div>
						<div class="step-content">
							<h3>{step.title}</h3>
							<p>{step.description}</p>
						</div>
						<div class="step-icon">
							<i class="fas fa-{step.icon}"></i>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</Section>
</div>

<style>
	.process {
		position: relative;
		max-width: 800px;
		margin: 4rem auto 2rem;
	}

	.step-container {
		position: relative;
		padding-bottom: 2.5rem;
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.6s ease;
	}

	.process.visible .step-container {
		opacity: 1;
		transform: translateY(0);
	}

	.process.visible .step-container:nth-child(1) {
		transition-delay: 0.1s;
	}

	.process.visible .step-container:nth-child(2) {
		transition-delay: 0.3s;
	}

	.process.visible .step-container:nth-child(3) {
		transition-delay: 0.5s;
	}

	.process.visible .step-container:nth-child(4) {
		transition-delay: 0.7s;
	}

	.step-container:last-child {
		padding-bottom: 0;
	}

	.step-connector {
		position: absolute;
		top: 30px;
		bottom: 0;
		left: 25px;
		width: 2px;
		background: linear-gradient(to bottom, rgba(123, 104, 238, 0.8), rgba(147, 112, 219, 0.5));
		z-index: 1;
	}

	.step-connector.first {
		top: 40px;
	}

	.step-connector.last {
		height: 0;
	}

	.step {
		position: relative;
		display: flex;
		align-items: flex-start;
		z-index: 2;
	}

	.step-number {
		background: linear-gradient(135deg, #7b68ee, #9370db);
		width: 50px;
		height: 50px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 1.2rem;
		box-shadow: 0 4px 15px rgba(123, 104, 238, 0.3);
		flex-shrink: 0;
		position: relative;
		z-index: 3;
		margin-right: 1.5rem;
	}

	.step-content {
		background: rgba(20, 20, 40, 0.5);
		padding: 1.5rem;
		border-radius: 12px;
		flex-grow: 1;
		border: 1px solid rgba(123, 104, 238, 0.15);
		box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
		position: relative;
		margin-right: 70px;
	}

	.step-content::after {
		content: '';
		position: absolute;
		left: -10px;
		top: 20px;
		width: 20px;
		height: 20px;
		background: rgba(20, 20, 40, 0.5);
		transform: rotate(45deg);
		border-left: 1px solid rgba(123, 104, 238, 0.15);
		border-bottom: 1px solid rgba(123, 104, 238, 0.15);
	}

	.step-content h3 {
		margin: 0 0 0.5rem 0;
		color: white;
		font-size: 1.3rem;
		font-family: 'Poppins', sans-serif;
		font-weight: 500;
	}

	.step-content p {
		margin: 0;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.5;
		font-size: 1rem;
	}

	.step-icon {
		position: absolute;
		top: 0;
		right: 0;
		width: 50px;
		height: 50px;
		background: linear-gradient(135deg, rgba(20, 20, 40, 0.7), rgba(30, 30, 60, 0.7));
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #9370db;
		font-size: 1.2rem;
		border: 1px solid rgba(123, 104, 238, 0.2);
	}

	@media (max-width: 768px) {
		.process {
			margin-left: 0;
			margin-right: 0;
		}

		.step-content {
			padding: 1.2rem;
			margin-right: 60px;
		}

		.step-icon {
			width: 40px;
			height: 40px;
			font-size: 1rem;
		}
	}

	@media (max-width: 480px) {
		.step {
			flex-direction: row;
			align-items: flex-start;
			text-align: left;
		}

		.step-number {
			margin-right: 1rem;
			margin-bottom: 0;
		}

		.step-connector {
			left: 25px;
			transform: none;
		}

		.step-content {
			width: calc(100% - 70px);
			margin-right: 0;
			padding: 1rem;
		}

		.step-content::after {
			display: block;
			left: -8px;
			top: 20px;
			width: 16px;
			height: 16px;
		}

		.step-icon {
			position: absolute;
			top: 0;
			right: 0;
			width: 40px;
			height: 40px;
			margin: 0;
			border-top: none;
			border-right: none;
			border-radius: 0 0 0 10px;
			background: none;
		}
	}
</style>
