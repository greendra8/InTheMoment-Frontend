<script lang="ts">
	import Section from './shared/Section.svelte';
</script>

<Section title="Features" centered={true} padding="medium">
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
						Experience crystal-clear guided meditations with dynamic soundscapes designed for deep
						focus
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
						Every session adapts to your feedback, creating a meditation practice that evolves with
						you
					</p>
				</div>
			</div>
		</div>
	</div>
</Section>

<style>
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
		color: var(--icon-primary, #9370db);
		font-size: 1.5rem;
		flex-shrink: 0;
		border: 1px solid rgba(123, 104, 238, 0.2);
		box-shadow: 0 0 15px rgba(106, 90, 205, 0.2);
	}

	.feature-content h3 {
		font-size: 1.4rem;
		margin: 0 0 0.8rem 0;
		color: var(--text-primary, white);
		font-family: 'Poppins', sans-serif;
		font-weight: 500;
	}

	.feature-content p {
		margin: 0;
		color: var(--text-secondary, rgba(255, 255, 255, 0.8));
		font-size: 1rem;
		line-height: 1.6;
	}

	@media (max-width: 1024px) {
		.features-wrapper {
			flex-direction: column;
		}
	}

	@media (max-width: 600px) {
		.feature-item {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}

		.feature-icon {
			margin-right: 0;
			margin-bottom: 1rem;
		}
	}
</style>
