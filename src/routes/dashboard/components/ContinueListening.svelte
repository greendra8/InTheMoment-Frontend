<script lang="ts">
	export let displayedMeditation;
	export let inProgressMeditation;
	export let recentPlaylists;
	export let handleNavigation;
</script>

<section class="content-section">
	<div class="section-header">
		<h2>{inProgressMeditation ? 'Continue Listening' : 'Recent Session'}</h2>
	</div>
	<div
		class="featured-session"
		on:click={() => handleNavigation(`/session/${displayedMeditation.id}`)}
		on:keydown={(e) => e.key === 'Enter' && handleNavigation(`/session/${displayedMeditation.id}`)}
		tabindex="0"
		role="button"
	>
		<div class="featured-play-button">
			<i class="fas fa-play"></i>
		</div>
		<div class="featured-info">
			<div class="title-row">
				<h3>{displayedMeditation.title || 'Untitled Meditation'}</h3>
				<span
					class="content-type-badge"
					class:hypnosis={displayedMeditation.content_type === 'hypnosis'}
				>
					{displayedMeditation.content_type === 'hypnosis' ? 'Hypnosis' : 'Meditation'}
				</span>
			</div>
			<div class="featured-meta">
				<span><i class="far fa-clock"></i> {displayedMeditation.length || 'N/A'} min</span>
				<span class="dot-separator">•</span>
				<span>{new Date(displayedMeditation.created_at).toLocaleDateString()}</span>
				{#if inProgressMeditation}
					<span class="dot-separator">•</span>
					<span class="in-progress-badge"><i class="fas fa-circle-play"></i> In Progress</span>
				{/if}
			</div>
		</div>
	</div>

	{#if recentPlaylists && recentPlaylists.length > 0}
		<div class="recently-listened">
			<div class="recent-playlists-container">
				<div class="recent-playlists-tabs">
					{#each recentPlaylists as playlist}
						<div
							class="recent-playlist-tab"
							on:click={() => handleNavigation(`/playlists/${playlist.id}`)}
							on:keydown={(e) => e.key === 'Enter' && handleNavigation(`/playlists/${playlist.id}`)}
							tabindex="0"
							role="button"
						>
							<div class="tab-icon">
								<i class="fas fa-headphones-alt"></i>
							</div>
							<div class="tab-name">{playlist.playlist_name}</div>
						</div>
					{/each}
				</div>
			</div>
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

	/* Continue Listening Section */
	.featured-session {
		display: flex;
		align-items: center;
		padding: 1.5rem;
		border-radius: 16px;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.1) 0%,
			rgba(var(--interactive-gradient-2), 0.15) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		box-shadow: 0 4px 15px var(--ui-shadow);
	}

	.featured-session:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		transform: translateY(-2px);
		box-shadow: 0 8px 20px var(--ui-shadowHover);
	}

	.featured-play-button {
		width: 54px;
		height: 54px;
		background: var(--play-btn-bg);
		color: var(--play-btn-text);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1.5rem;
		flex-shrink: 0;
		box-shadow: 0 0 20px rgba(var(--interactive-gradient-1), 0.25);
		transition: all 0.3s ease;
		position: relative;
		z-index: 1;
		font-size: 1.2rem;
	}

	.featured-session:hover .featured-play-button {
		background: var(--play-btn-bg-hover);
		box-shadow: 0 0 25px rgba(var(--interactive-gradient-1), 0.4);
		transform: scale(1.08);
	}

	.featured-info {
		flex-grow: 1;
		overflow: hidden;
		position: relative;
		z-index: 1;
	}

	.title-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.3rem;
	}

	.featured-info h3 {
		font-size: 1.2rem;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
	}

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

	.featured-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin-top: 0.4rem;
	}

	.in-progress-badge {
		color: var(--icon-primary);
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.85rem;
		font-weight: 500;
		margin-top: -2px;
	}

	.in-progress-badge i {
		font-size: 0.8rem;
	}

	.dot-separator {
		margin: 0 0.6rem;
		opacity: 0.7;
	}

	/* Recent Playlists Tabs */
	.recently-listened {
		margin-top: 1.5rem;
		width: 100%;
	}

	.recent-playlists-container {
		margin: 0 -1rem; /* Extend beyond container padding */
		overflow-x: auto;
		overflow-y: hidden;
		-webkit-overflow-scrolling: touch; /* Smoother scrolling on iOS */
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE/Edge */
		position: relative;
		padding: 0.5rem 1rem; /* Add padding back on the scrollable container */
	}

	.recent-playlists-container::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}

	.recent-playlists-tabs {
		display: flex;
		gap: 0.8rem;
		width: max-content; /* Ensure it can expand as needed */
	}

	.recent-playlist-tab {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 1rem;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		white-space: nowrap;
		flex: 0 0 auto;
	}

	.recent-playlist-tab:hover {
		transform: translateY(-2px);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		box-shadow: 0 4px 10px var(--ui-shadowHover);
	}

	.tab-icon {
		width: 28px;
		height: 28px;
		background: rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--icon-primary);
		font-size: 0.8rem;
	}

	.tab-name {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-primary);
	}
</style>
