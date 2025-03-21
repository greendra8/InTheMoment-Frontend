<script lang="ts">
	export let totalMinutes;
	export let daysInRow;
	export let totalMeditations;
	export let enabled = false; // Disabled by default
</script>

{#if enabled}
	<section class="content-section">
		<div class="stats-container">
			<div class="stat-card minutes-card">
				<div class="stat-icon">
					<i class="fas fa-clock"></i>
				</div>
				<div class="stat-details">
					<div class="stat-value">{totalMinutes}</div>
					<div class="stat-label">Minutes</div>
				</div>
			</div>

			<div class="stat-card streak-card">
				<div class="stat-icon">
					<i class="fas fa-fire"></i>
				</div>
				<div class="stat-details">
					<div class="stat-value">{daysInRow}</div>
					<div class="stat-label">Day Streak</div>
				</div>
			</div>

			<div class="stat-card sessions-card">
				<div class="stat-icon">
					<i class="fas fa-headphones"></i>
				</div>
				<div class="stat-details">
					<div class="stat-value">{totalMeditations}</div>
					<div class="stat-label">Sessions</div>
				</div>
			</div>
		</div>
	</section>
{/if}

<style>
	/* Content Sections */
	.content-section {
		margin-bottom: 2rem;
		position: relative;
	}

	/* Stats Container */
	.stats-container {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem 0.75rem;
		border-radius: 12px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		box-shadow: 0 4px 15px var(--ui-shadow);
		position: relative;
		overflow: hidden;
		text-align: center;
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(0, 0, 40, 0.3);
	}

	.stat-icon {
		font-size: 1.2rem;
		color: var(--icon-primary);
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		border-radius: 50%;
		margin-bottom: 0.5rem;
		background: rgba(var(--interactive-gradient-1), 0.1);
		box-shadow: 0 0 10px rgba(var(--interactive-gradient-1), 0.1);
		position: relative;
		z-index: 1;
	}

	.stat-details {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}

	.stat-value {
		font-size: 1.4rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.stat-label {
		font-size: 0.8rem;
		color: var(--text-secondary);
		position: relative;
	}

	/* Responsive Adjustments */
	@media (max-width: 480px) {
		.stats-container {
			grid-template-columns: repeat(3, 1fr);
			gap: 0.5rem;
		}

		.stat-card {
			padding: 0.5rem 0.25rem;
		}

		.stat-icon {
			font-size: 0.9rem;
			width: 28px;
			height: 28px;
			margin-bottom: 0.3rem;
		}

		.stat-value {
			font-size: 1rem;
		}

		.stat-label {
			font-size: 0.6rem;
		}
	}
</style>
