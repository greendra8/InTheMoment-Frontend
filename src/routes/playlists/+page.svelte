<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let data: PageData;

	// Animation for glow effects
	let pulseValue = 0;

	onMount(() => {
		const pulseInterval = setInterval(() => {
			pulseValue = 0.5 + Math.sin(Date.now() / 1000) * 0.5;
		}, 50);

		return () => clearInterval(pulseInterval);
	});

	function handleNavigation(path: string) {
		goto(path);
	}
</script>

<svelte:head>
	<title>Playlists - In The Moment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<div class="neo-playlists">
	<!-- Page Title -->
	<div class="page-header">
		<h1>Playlists</h1>
		<p class="tagline">Curated meditation journeys</p>
	</div>

	<!-- Info Card -->
	<div class="info-card">
		<div class="info-icon">
			<i class="fas fa-info-circle"></i>
		</div>
		<p>All playlists and lessons are created by humans to guide your meditation practice.</p>
	</div>

	<!-- Featured Playlist -->
	{#if data.playlists.length > 0}
		<section class="content-section">
			<div class="section-header">
				<h2>Featured Playlist</h2>
			</div>
			<div
				class="featured-playlist"
				on:click={() => handleNavigation(`/playlists/${data.playlists[0].id}`)}
				on:keydown={(e) =>
					e.key === 'Enter' && handleNavigation(`/playlists/${data.playlists[0].id}`)}
				tabindex="0"
				role="button"
			>
				<div class="featured-icon">
					<i class="fas fa-play-circle"></i>
				</div>
				<div class="featured-info">
					<h3>{data.playlists[0].playlist_name}</h3>
					<p class="featured-description">
						{data.playlists[0].playlist_description ||
							'Start your meditation journey with this playlist.'}
					</p>
				</div>
				<div class="featured-arrow">
					<i class="fas fa-arrow-right"></i>
				</div>
			</div>
		</section>
	{/if}

	<!-- All Playlists Grid -->
	<section class="content-section">
		<div class="section-header">
			<h2>All Playlists</h2>
		</div>

		<div class="playlists-list">
			{#each data.playlists as playlist, i}
				<div
					class="playlist-item card-color-{i % 4}"
					on:click={() => handleNavigation(`/playlists/${playlist.id}`)}
					on:keydown={(e) => e.key === 'Enter' && handleNavigation(`/playlists/${playlist.id}`)}
					tabindex="0"
					role="button"
				>
					<div class="playlist-icon">
						<i class="fas fa-play-circle"></i>
					</div>
					<div class="playlist-info">
						<h3>{playlist.playlist_name}</h3>
					</div>
					<div class="playlist-arrow">
						<i class="fas fa-arrow-right"></i>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Empty State (if no playlists) -->
	{#if data.playlists.length === 0}
		<div class="empty-state">
			<i class="fas fa-music"></i>
			<p>No playlists available yet</p>
			<button class="create-btn" on:click={() => handleNavigation('/new')}>
				Create Your First Meditation
			</button>
		</div>
	{/if}
</div>

<style>
	/* Base Styles */
	.neo-playlists {
		position: relative;
		overflow: visible;
		width: 100%;
		padding: 1.5rem 0;
	}

	/* Subtle ambient glow */
	.neo-playlists::after {
		content: '';
		position: absolute;
		top: 10%;
		right: 10%;
		width: 40%;
		height: 40%;
		background: radial-gradient(
			ellipse at center,
			rgba(var(--interactive-gradient-1), 0.04) 0%,
			rgba(var(--interactive-gradient-1), 0) 70%
		);
		border-radius: 50%;
		z-index: -1;
		pointer-events: none;
		filter: blur(60px);
	}

	/* Typography */
	h1,
	h2,
	h3 {
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
	}

	h1 {
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.1);
		margin-top: 1rem;
		margin-bottom: 0.5rem;
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
		font-size: 1.1rem;
		font-weight: 500;
	}

	p {
		color: var(--text-secondary);
		font-weight: 300;
		margin: 0;
	}

	/* Page Header */
	.page-header {
		margin-bottom: 1.5rem;
	}

	.tagline {
		font-size: 1rem;
		opacity: 0.8;
	}

	/* Info Card */
	.info-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.2rem;
		margin-bottom: 2rem;
		border-radius: 12px;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.1) 0%,
			rgba(var(--interactive-gradient-2), 0.05) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		box-shadow: 0 4px 15px var(--ui-shadow);
	}

	.info-icon {
		font-size: 1.2rem;
		color: rgba(var(--interactive-gradient-1), 0.8);
		flex-shrink: 0;
	}

	.info-card p {
		font-size: 0.9rem;
		line-height: 1.4;
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

	/* Featured Playlist */
	.featured-playlist {
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
		backdrop-filter: blur(5px);
		box-shadow: 0 4px 15px var(--ui-shadow);
	}

	/* light theme featured playlist */
	:global(.light-theme) .featured-playlist,
	:global(.light-theme) .playlist-item {
		background: var(--grey-shade) !important;
	}

	.featured-playlist:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		transform: translateY(-2px);
		box-shadow: 0 8px 20px var(--ui-shadowHover);
	}

	.featured-icon {
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

	.featured-playlist:hover .featured-icon {
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

	.featured-info h3 {
		font-size: 1.2rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}

	.featured-description {
		font-size: 0.9rem;
		color: var(--text-secondary);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.featured-arrow {
		color: var(--icon-primary);
		font-size: 1.2rem;
		margin-left: 1rem;
		opacity: 0.7;
		transition: all 0.3s ease;
	}

	.featured-playlist:hover .featured-arrow {
		opacity: 1;
		transform: translateX(5px);
	}

	/* Playlists List - More compact design */
	.playlists-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		position: relative;
	}

	.playlist-item {
		display: flex;
		align-items: center;
		padding: 0.9rem 1.2rem;
		border-radius: 12px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(5px);
		box-shadow: 0 4px 15px var(--ui-shadow);
	}

	.playlist-item:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	.playlist-icon {
		width: 40px;
		height: 40px;
		background: rgba(var(--interactive-gradient-1), 0.15);
		color: var(--icon-primary);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1rem;
		flex-shrink: 0;
		transition: all 0.3s ease;
		font-size: 1rem;
		box-shadow: 0 0 10px rgba(var(--interactive-gradient-1), 0.1);
	}

	.playlist-item:hover .playlist-icon {
		background: rgba(var(--interactive-gradient-1), 0.2);
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.2);
		transform: scale(1.05);
	}

	.playlist-info {
		flex-grow: 1;
		overflow: hidden;
	}

	.playlist-info h3 {
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.playlist-arrow {
		color: var(--icon-primary);
		font-size: 1rem;
		opacity: 0.7;
		transition: all 0.3s ease;
		margin-left: 0.5rem;
	}

	.playlist-item:hover .playlist-arrow {
		opacity: 1;
		transform: translateX(5px);
	}

	/* Card color variations */
	.card-color-0 {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.15) 0%,
			rgba(var(--interactive-gradient-2), 0.1) 100%
		);
	}

	.card-color-1 {
		background: linear-gradient(
			135deg,
			rgba(var(--gradient-3), 0.15) 0%,
			rgba(var(--gradient-4), 0.1) 100%
		);
	}

	.card-color-2 {
		background: linear-gradient(
			135deg,
			rgba(var(--gradient-5), 0.15) 0%,
			rgba(var(--gradient-6), 0.1) 100%
		);
	}

	.card-color-3 {
		background: linear-gradient(
			135deg,
			rgba(var(--gradient-7), 0.15) 0%,
			rgba(var(--gradient-8), 0.1) 100%
		);
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 2.5rem 1.5rem;
		border-radius: 16px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(5px);
		box-shadow: 0 4px 15px var(--ui-shadow);
	}

	.empty-state i {
		font-size: 2rem;
		color: rgba(var(--icon-primary-rgb), 0.6);
		margin-bottom: 1rem;
		filter: drop-shadow(0 0 5px rgba(var(--icon-primary-rgb), 0.2));
	}

	.empty-state p {
		font-size: 1rem;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
	}

	.create-btn {
		padding: 0.8rem 1.5rem;
		font-size: 0.9rem;
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.create-btn:hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(var(--interactive-gradient-1), 0.25);
	}

	/* Responsive Adjustments */
	@media (max-width: 768px) {
		.featured-playlist {
			padding: 1.2rem;
		}

		.featured-icon {
			width: 45px;
			height: 45px;
			font-size: 1rem;
			margin-right: 1rem;
		}

		.featured-info h3 {
			font-size: 1.1rem;
		}

		.featured-description {
			font-size: 0.85rem;
		}

		.playlist-item {
			padding: 0.8rem 1rem;
		}

		.playlist-icon {
			width: 36px;
			height: 36px;
			margin-right: 0.8rem;
		}

		.playlist-info h3 {
			font-size: 1rem;
		}
	}

	@media (max-width: 480px) {
		.page-header {
			margin: 1.5rem 0;
		}

		h1 {
			font-size: 1.5rem;
		}

		.tagline {
			font-size: 0.8rem;
		}

		.info-card {
			padding: 1rem;
		}

		.info-icon {
			font-size: 1rem;
		}

		.info-card p {
			font-size: 0.8rem;
		}

		.featured-playlist {
			padding: 1rem;
		}

		.featured-icon {
			width: 40px;
			height: 40px;
			font-size: 0.9rem;
			margin-right: 0.8rem;
		}

		.featured-info h3 {
			font-size: 1rem;
			margin-bottom: 0.3rem;
		}

		.featured-description {
			font-size: 0.8rem;
			-webkit-line-clamp: 2;
		}

		.featured-arrow {
			font-size: 1rem;
		}

		.playlist-item {
			padding: 0.7rem 0.9rem;
		}

		.playlist-icon {
			width: 32px;
			height: 32px;
			font-size: 0.9rem;
			margin-right: 0.7rem;
		}

		.playlist-info h3 {
			font-size: 0.9rem;
		}
	}
</style>
