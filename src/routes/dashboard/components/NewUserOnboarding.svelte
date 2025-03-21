<script lang="ts">
	export let handleNavigation;
	export let pulseValue;
</script>

<section class="content-section">
	<div class="empty-state">
		<div class="welcome-message">
			<i class="fas fa-spa pulse-icon" style="opacity: {pulseValue}"></i>
			<h3>Welcome to Your Mindfulness Journey</h3>
			<p>Start your first meditation to begin tracking your progress</p>
		</div>

		<div class="onboarding-options">
			<div
				class="onboarding-card"
				on:click={() => handleNavigation('/playlists')}
				on:keydown={(e) => e.key === 'Enter' && handleNavigation('/playlists')}
				tabindex="0"
				role="button"
			>
				<div class="onboarding-icon">
					<i class="fas fa-play-circle"></i>
				</div>
				<div class="onboarding-content">
					<h4>Start a Guided Session</h4>
					<p>Choose from our curated playlists</p>
				</div>
				<i class="fas fa-chevron-right arrow-icon"></i>
			</div>

			<div
				class="onboarding-card"
				on:click={() => handleNavigation('/new')}
				on:keydown={(e) => e.key === 'Enter' && handleNavigation('/new')}
				tabindex="0"
				role="button"
			>
				<div class="onboarding-icon">
					<i class="fas fa-microphone-alt"></i>
				</div>
				<div class="onboarding-content">
					<h4>Create Custom Meditation</h4>
					<p>Design your own mindfulness experience</p>
				</div>
				<i class="fas fa-chevron-right arrow-icon"></i>
			</div>

			<div
				class="onboarding-card"
				on:click={() => handleNavigation('/profile')}
				on:keydown={(e) => e.key === 'Enter' && handleNavigation('/profile')}
				tabindex="0"
				role="button"
			>
				<div class="onboarding-icon">
					<i class="fas fa-sliders-h"></i>
				</div>
				<div class="onboarding-content">
					<h4>Customize Your Experience</h4>
					<p>Choose your mentor's voice and app theme</p>
				</div>
				<i class="fas fa-chevron-right arrow-icon"></i>
			</div>
		</div>
	</div>
</section>

<style>
	/* Typography */
	h3 {
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
		font-size: 1rem;
		font-weight: 500;
	}

	h4 {
		font-size: 0.95rem;
		font-weight: 600;
		margin: 0 0 0.2rem 0;
		color: var(--text-primary);
	}

	p {
		color: var(--text-secondary);
		font-weight: 300;
	}

	/* Content Sections */
	.content-section {
		margin-bottom: 2rem;
		position: relative;
	}

	/* Empty state and onboarding */
	.empty-state {
		padding: 2rem;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border-radius: 16px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		box-shadow: 0 4px 15px var(--ui-shadow);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
	}

	.welcome-message {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.welcome-message i {
		font-size: 2rem;
		color: var(--icon-primary);
		margin-bottom: 1rem;
		transition: opacity 0.3s ease;
	}

	.welcome-message h3 {
		font-size: 1.3rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.welcome-message p {
		font-size: 0.95rem;
		max-width: 80%;
		margin: 0 auto;
	}

	.onboarding-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 500px;
	}

	.onboarding-card {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.6) 0%,
			rgba(var(--background-card-rgb), 0.3) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.onboarding-card:hover {
		transform: translateY(-2px);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	.onboarding-icon {
		font-size: 1.2rem;
		color: var(--icon-primary);
		width: 42px;
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 50%;
		transition: all 0.3s ease;
	}

	.onboarding-card:hover .onboarding-icon {
		background: rgba(var(--interactive-gradient-1), 0.2);
		transform: scale(1.05);
	}

	.onboarding-content {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.onboarding-content p {
		margin: 0;
		font-size: 0.85rem;
	}

	.arrow-icon {
		color: var(--text-secondary);
		font-size: 0.9rem;
		opacity: 0.7;
		transition: opacity 0.3s ease;
	}

	.onboarding-card:hover .arrow-icon {
		opacity: 1;
		transform: translateX(2px);
	}

	.pulse-icon {
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0.5;
		}
	}

	/* Responsive Adjustments */
	@media (max-width: 480px) {
		.empty-state {
			padding: 1.5rem 1rem;
		}

		.welcome-message h3 {
			font-size: 1.1rem;
		}

		.welcome-message p {
			font-size: 0.8rem;
		}

		.onboarding-card {
			padding: 0.8rem;
		}

		.onboarding-icon {
			width: 32px;
			height: 32px;
			margin-right: 0.8rem;
		}

		.onboarding-content h4 {
			font-size: 0.85rem;
		}

		.onboarding-content p {
			font-size: 0.75rem;
		}
	}
</style>
