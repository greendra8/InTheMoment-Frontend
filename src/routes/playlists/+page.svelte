<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { text, background, ui, icon } from '$lib/theme';

	export let data: PageData;
</script>

<svelte:head>
	<title>Playlists</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="playlists-page">
	<h1>Playlists</h1>

	<!-- info label saying that all playlists and lessons are created by humans -->
	<p class="info-label">
		<i class="fas fa-info-circle"></i>
		All playlists and lessons are created by humans.
	</p>

	<div class="playlist-grid">
		{#each data.playlists as playlist, index (playlist.id)}
			<div
				class="playlist-card"
				class:full-width={index === 0}
				on:click={() => goto(`/playlists/${playlist.id}`)}
				on:keydown={(e) => {
					if (e.key === 'Enter') goto(`/playlists/${playlist.id}`);
				}}
				tabindex="0"
				role="button"
			>
				<div class="playlist-icon">
					<i class="fas fa-play-circle"></i>
				</div>
				<h2>{playlist.playlist_name}</h2>
				<div class="playlist-arrow">
					<i class="fas fa-arrow-right"></i>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.playlists-page {
		width: 100%;
		padding: 1.5rem 0;
	}

	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.1);
	}

	.info-label {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.1) 0%,
			rgba(var(--interactive-gradient-2), 0.05) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 12px;
		backdrop-filter: blur(5px);
	}

	.info-label i {
		color: rgba(var(--interactive-gradient-1), 0.6);
	}

	.playlist-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}

	.playlist-card {
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		color: var(--text-primary);
		border-radius: 12px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		box-shadow: 0 4px 15px var(--ui-shadow);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		backdrop-filter: blur(5px);
	}

	/* Add shine effect */
	.playlist-card::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 50%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transform: skewX(-25deg);
		transition: all 0.75s ease;
	}

	.playlist-card:hover::after {
		left: 100%;
	}

	.playlist-card.full-width {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: auto 1fr auto;
		grid-template-rows: auto;
		gap: 0.5rem;
		padding: 1.2rem 1.5rem;
		align-items: center;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.15) 0%,
			rgba(var(--interactive-gradient-2), 0.1) 100%
		);
	}

	.full-width .playlist-icon {
		grid-column: 1;
		grid-row: 1;
		font-size: 2rem;
		margin-right: 1rem;
		color: rgba(var(--interactive-gradient-1), 0.8);
	}

	.full-width h2 {
		grid-column: 2;
		grid-row: 1;
		font-size: 1.3rem;
		align-self: center;
	}

	.full-width .playlist-arrow {
		grid-column: 3;
		grid-row: 1;
		font-size: 1.3rem;
		justify-self: end;
		align-self: center;
		opacity: 1;
		color: rgba(var(--interactive-gradient-1), 0.8);
	}

	.playlist-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
	}

	.playlist-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
		color: rgba(var(--interactive-gradient-1), 0.8);
		transition: transform 0.3s ease;
	}

	.playlist-card:hover .playlist-icon {
		transform: scale(1.1);
	}

	.playlist-card h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.1rem;
		font-weight: 500;
		margin: 0;
		line-height: 1.2;
		color: var(--text-primary);
	}

	.playlist-arrow {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		font-size: 1rem;
		opacity: 0;
		transition: all 0.3s ease;
		color: rgba(var(--interactive-gradient-1), 0.8);
	}

	.playlist-card:hover .playlist-arrow {
		opacity: 1;
		transform: translateX(5px);
	}

	@media (max-width: 768px) {
		.playlist-card {
			padding: 1.2rem;
		}

		.playlist-card.full-width {
			padding: 1rem 1.2rem;
		}

		.full-width .playlist-icon {
			font-size: 1.75rem;
		}

		.full-width h2 {
			font-size: 1.1rem;
		}

		.playlist-icon {
			font-size: 1.5rem;
		}

		.playlist-card h2 {
			font-size: 1rem;
		}

		.info-label {
			padding: 0.6rem 0.8rem;
			font-size: 0.85rem;
		}
	}
</style>
