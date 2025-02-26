<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	export let data: PageData;

	$: ({ playlists, meditations, user } = data);

	// Function to get time of day greeting
	function getGreeting() {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	}

	// Function to format the date
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	// Function to get random grey color for playlist cards
	function getRandomGrey() {
		const greys = [
			{ bg: '#4A4A4A', text: '#FFFFFF' },
			{ bg: '#616161', text: '#FFFFFF' },
			{ bg: '#757575', text: '#FFFFFF' },
			{ bg: '#9E9E9E', text: '#FFFFFF' },
			{ bg: '#BDBDBD', text: '#FFFFFF' }
		];
		return greys[Math.floor(Math.random() * greys.length)];
	}
</script>

<div class="dashboard">
	<!-- Welcome Section -->
	<section class="welcome-section">
		<h1>{getGreeting()}, {user?.user_metadata?.full_name?.split(' ')[0] ?? 'there'}</h1>
		<p class="subtitle">How would you like to meditate today?</p>
	</section>

	<!-- Main Actions -->
	<section class="main-actions">
		<button class="primary-action custom-session" on:click={() => goto('/new')}>
			<div class="action-content">
				<i class="fas fa-wand-magic-sparkles"></i>
				<div class="action-text">
					<span class="action-title">Custom Session</span>
					<span class="action-description">Create a personalized meditation</span>
				</div>
			</div>
			<i class="fas fa-chevron-right action-arrow"></i>
		</button>
	</section>

	<!-- Playlists Section -->
	<section class="playlists-section">
		<div class="section-header">
			<h2>Quick Start</h2>
			<button class="text-button" on:click={() => goto('/playlists')}>View All</button>
		</div>
		<div class="playlists-grid">
			{#each playlists?.slice(0, 4) ?? [] as playlist}
				{@const colors = getRandomGrey()}
				<button
					class="playlist-card"
					style="--card-bg-color: {colors.bg}; --card-text-color: {colors.text};"
					on:click={() => goto(`/playlists/${playlist.id}`)}
				>
					<div class="playlist-icon">
						<i class="fas fa-play-circle"></i>
					</div>
					<span class="playlist-name">{playlist.playlist_name}</span>
				</button>
			{/each}
		</div>
	</section>

	<!-- Library Link -->
	<section class="library-link">
		<button class="secondary-action" on:click={() => goto('/library')}>
			<div class="action-content">
				<i class="fas fa-book"></i>
				<div class="action-text">
					<span class="action-title">Your Library</span>
					<span class="action-description">View your past meditations</span>
				</div>
			</div>
			<i class="fas fa-chevron-right action-arrow"></i>
		</button>
	</section>

	<!-- Recent Sessions -->
	{#if meditations && meditations.length > 0}
		<section class="recent-sessions">
			<div class="section-header">
				<h2>Recent</h2>
			</div>
			<div class="sessions-list">
				{#each meditations.slice(0, 3) as meditation}
					<a href="/session/{meditation.id}" class="session-card">
						<div class="session-icon">
							<i class="fas fa-play"></i>
						</div>
						<div class="session-info">
							<span class="session-title">{meditation.title || 'Untitled Meditation'}</span>
							<span class="session-meta">
								{meditation.lesson_playlists?.playlist_name || meditation.theme || 'Custom'} •
								{formatDate(meditation.created_at)}
							</span>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.dashboard {
		padding-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* Welcome Section */
	.welcome-section {
		margin-bottom: 0.5rem;
	}

	.welcome-section h1 {
		font-family: 'Poppins', sans-serif;
		font-size: 1.75rem;
		font-weight: 600;
		margin: 0;
		color: #333;
	}

	.subtitle {
		color: #666;
		margin: 0.25rem 0 0 0;
	}

	/* Main Actions */
	.main-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.primary-action {
		background-color: #333;
		color: white;
		border: none;
		border-radius: 12px;
		padding: 1.25rem;
		font-size: 1.1rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-content {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.action-text {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
	}

	.action-title {
		font-weight: 600;
		font-size: 1.1rem;
	}

	.action-description {
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.action-arrow {
		font-size: 1rem;
		opacity: 0.7;
	}

	.primary-action:hover {
		background-color: #444;
		transform: translateY(-2px);
	}

	.primary-action:hover .action-arrow {
		opacity: 1;
	}

	/* Section Headers */
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.section-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.text-button {
		background: none;
		border: none;
		color: #666;
		font-size: 0.9rem;
		cursor: pointer;
		padding: 0;
	}

	.text-button:hover {
		color: #333;
	}

	/* Playlists Grid */
	.playlists-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.playlist-card {
		background-color: var(--card-bg-color, #4a4a4a);
		color: var(--card-text-color, #ffffff);
		border: none;
		border-radius: 12px;
		padding: 1.25rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
		aspect-ratio: 1;
	}

	.playlist-card:hover {
		transform: translateY(-2px);
	}

	.playlist-icon {
		font-size: 1.5rem;
	}

	.playlist-name {
		font-size: 1rem;
		font-weight: 500;
		line-height: 1.2;
	}

	/* Library Link */
	.secondary-action {
		background-color: #f5f5f5;
		color: #333;
		border: none;
		border-radius: 12px;
		padding: 1.25rem;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.secondary-action:hover {
		background-color: #eee;
		transform: translateY(-2px);
	}

	.secondary-action:hover .action-arrow {
		opacity: 1;
	}

	/* Recent Sessions */
	.sessions-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.session-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background-color: #f5f5f5;
		border-radius: 12px;
		text-decoration: none;
		color: inherit;
		transition: background-color 0.2s ease;
	}

	.session-card:hover {
		background-color: #eee;
	}

	.session-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background-color: #333;
		color: white;
		border-radius: 50%;
		flex-shrink: 0;
		font-size: 0.8rem;
	}

	.session-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.session-title {
		font-weight: 500;
		color: #333;
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.session-meta {
		color: #666;
		font-size: 0.8rem;
	}

	/* Global button styles */
	button {
		font-family: 'Poppins', sans-serif;
	}
</style>
