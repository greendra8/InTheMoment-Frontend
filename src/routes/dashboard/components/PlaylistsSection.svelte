<script lang="ts">
	export let playlists;
	export let handleNavigation;
</script>

<section class="content-section">
	<div class="section-header">
		<h2>Recommended Playlists</h2>
		<button class="view-all-btn" on:click={() => handleNavigation('/playlists')}> See All </button>
	</div>

	<div class="playlists-grid">
		{#each playlists.slice(0, 4) as playlist, i}
			<div
				class="playlist-card"
				on:click={() => handleNavigation(`/playlists/${playlist.id}`)}
				on:keydown={(e) => e.key === 'Enter' && handleNavigation(`/playlists/${playlist.id}`)}
				tabindex="0"
				role="button"
			>
				<div class="playlist-content">
					<div class="playlist-icon">
						<i class="fas fa-play-circle"></i>
					</div>
					<div class="playlist-name">{playlist.playlist_name}</div>
				</div>
				<div class="playlist-shine"></div>
			</div>
		{/each}
	</div>
</section>

<style>
	/* Typography */
	h2 {
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
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

	.view-all-btn:hover::after {
		width: 100%;
	}

	/* Playlists Grid */
	.playlists-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		position: relative;
	}

	.playlist-card {
		position: relative;
		border-radius: 12px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.3) 0%,
			rgba(var(--background-card-rgb), 0) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		overflow: hidden;
		cursor: pointer;
		transition: all 0.3s ease;
		aspect-ratio: 16 / 9;
	}

	.playlist-card:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	.playlist-content {
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9),
			rgba(var(--background-card-rgb), 0.7)
		);
		position: relative;
		z-index: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		padding: 1.2rem;
	}

	.playlist-icon {
		font-size: 1.4rem;
		color: var(--text-primary);
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(var(--interactive-gradient-1), 0.15);
		border-radius: 50%;
		margin-bottom: 0.8rem;
		flex-shrink: 0;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		box-shadow: 0 0 10px rgba(var(--interactive-gradient-1), 0.1);
	}

	.playlist-card:hover .playlist-icon {
		background: rgba(var(--interactive-gradient-1), 0.2);
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.2);
		transform: scale(1.05);
	}

	.playlist-name {
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--text-primary);
		text-align: left;
		width: 100%;
		position: relative;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Responsive Adjustments */
	@media (max-width: 480px) {
		.playlists-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.5rem;
		}

		.playlist-content {
			padding: 0.8rem;
		}

		.playlist-icon {
			width: 32px;
			height: 32px;
			font-size: 1rem;
			margin-bottom: 0.5rem;
		}

		.playlist-name {
			font-size: 0.9rem;
			-webkit-line-clamp: 2;
		}
	}
</style>
