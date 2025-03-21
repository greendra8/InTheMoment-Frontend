<script lang="ts">
	export let meditations;
	export let handleNavigation;
</script>

<section class="content-section">
	<div class="section-header">
		<h2>Recent Sessions</h2>
		{#if meditations.length > 0}
			<button class="view-all-btn" on:click={() => handleNavigation('/library')}> View All </button>
		{/if}
	</div>

	{#if meditations.length > 0}
		<div class="sessions-list">
			{#each meditations.slice(0, 3) as meditation, i (meditation.id)}
				<div
					class="session-item"
					style="--bg-pattern: url('{meditation.bgPattern}')"
					on:click={() => handleNavigation(`/session/${meditation.id}`)}
					on:keydown={(e) => e.key === 'Enter' && handleNavigation(`/session/${meditation.id}`)}
					tabindex="0"
					role="button"
				>
					<div class="session-play-button">
						<i class="fas fa-play"></i>
					</div>
					<div class="session-info">
						<div class="title-row">
							<h3>{meditation.title || 'Untitled Meditation'}</h3>
							<span
								class="content-type-badge"
								class:hypnosis={meditation.content_type === 'hypnosis'}
							>
								{meditation.content_type === 'hypnosis' ? 'Hypnosis' : 'Meditation'}
							</span>
						</div>
						<div class="session-meta">
							<span><i class="far fa-clock"></i> {meditation.length || 'N/A'} min</span>
							<span class="dot-separator">•</span>
							<span>{new Date(meditation.created_at).toLocaleDateString()}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state simple-empty-state">
			<i class="fas fa-music"></i>
			<p>No recent sessions yet</p>
			<button class="create-btn" on:click={() => handleNavigation('/new')}>
				Create Your First Meditation
			</button>
		</div>
	{/if}
</section>

<style>
	/* Typography */
	h2,
	h3 {
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
	}

	h2 {
		font-size: 1.5rem;
		letter-spacing: -0.3px;
		position: relative;
		display: inline-block;
	}

	h2::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 0;
		width: 30px;
		height: 2px;
		background: linear-gradient(
			90deg,
			rgba(var(--icon-primary-rgb), 0.6),
			rgba(var(--icon-primary-rgb), 0)
		);
		border-radius: 2px;
	}

	h3 {
		font-size: 1rem;
		font-weight: 500;
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

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.view-all-btn {
		font-size: 0.8rem;
		color: var(--icon-primary);
		background: transparent;
		border: none;
		padding: 0.4rem 0;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
	}

	/* Sessions List */
	.sessions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: relative;
	}

	.session-item {
		display: flex;
		align-items: center;
		padding: 1rem;
		border-radius: 12px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		position: relative;
		overflow: hidden;
		box-shadow: 0 4px 15px var(--ui-shadow);
	}

	.session-item:hover {
		background: var(--fixed-card-bg);
		border-color: var(--fixed-card-border-hover);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	/* Background pattern styling */
	.session-item::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 70%;
		background-position: center;
		background-size: cover;
		background-image: var(--bg-pattern);
		opacity: 0.15;
		z-index: 0;
		mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0) 100%);
		-webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0) 100%);
		transition: opacity 0.3s ease;
	}

	.session-item:hover::before {
		opacity: 0.25;
	}

	.session-play-button {
		width: 40px;
		height: 40px;
		background: var(--fixed-play-button);
		box-shadow: 0 0 8px rgba(var(--interactive-gradient-1), 0.3);
		color: var(--play-btn-text);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1rem;
		flex-shrink: 0;
		transition:
			transform 0.2s ease,
			background 0.2s ease;
		position: relative;
		z-index: 1;
	}

	.session-item:hover .session-play-button {
		background: var(--fixed-play-button-hover);
		transform: scale(1.05);
		box-shadow: 0 0 8px rgba(var(--interactive-gradient-1), 0.6);
	}

	.session-info {
		flex-grow: 1;
		overflow: hidden;
		position: relative;
		z-index: 1;
	}

	.session-info h3 {
		font-size: 1rem;
		font-weight: 500;
		margin: 0;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.session-info .title-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.3rem;
	}

	/* Content type badge */
	.content-type-badge {
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		border-radius: 10px;
		background: var(--meditation-badge-bg);
		color: var(--meditation-badge-text);
		font-weight: 500;
		text-transform: capitalize;
		border: 1px solid rgba(255, 255, 255, 0.1);
		display: inline-block;
	}

	.content-type-badge.hypnosis {
		background: var(--hypnosis-badge-bg);
		color: var(--hypnosis-badge-text);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.session-meta {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: 0;
	}

	.dot-separator {
		margin: 0 0.6rem;
		opacity: 0.7;
	}

	/* Empty state */
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
		gap: 1rem;
		text-align: center;
	}

	.simple-empty-state {
		padding: 3rem 1rem;
	}

	.simple-empty-state i {
		font-size: 2rem;
		color: var(--icon-primary);
		margin-bottom: 1rem;
		opacity: 0.7;
	}

	.simple-empty-state p {
		font-size: 1rem;
		margin-bottom: 1.5rem;
	}

	.create-btn {
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 12px;
		padding: 0.6rem 1.2rem;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.create-btn:hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(var(--interactive-gradient-1), 0.25);
	}

	/* Responsive Adjustments */
	@media (max-width: 480px) {
		/* Session item mobile improvements */
		.session-item {
			padding: 0.8rem;
		}

		.session-play-button {
			width: 35px;
			height: 35px;
			margin-right: 0.8rem;
		}

		.session-info h3 {
			font-size: 0.9rem;
		}

		.session-meta {
			font-size: 0.75rem;
		}

		.in-progress-badge {
			font-size: 0.75rem;
		}

		.in-progress-badge i {
			font-size: 0.7rem;
		}

		.simple-empty-state {
			padding: 1.5rem 1rem;
		}

		.simple-empty-state p {
			font-size: 0.9rem;
		}
	}
</style>
