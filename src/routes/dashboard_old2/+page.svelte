<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { theme as themeStore } from '$lib/stores/theme';
	import { text, background, ui, icon, darkTheme, cosmicTheme } from '$lib/theme';

	export let data: PageData;

	$: ({ meditations, totalMeditations, playlists, user } = data);

	// Calculate stats
	$: daysInRow = calculateDaysInRow(meditations);
	$: totalMinutes = user.minutesListened || 0;

	function calculateDaysInRow(meditations: any[]) {
		if (!meditations || meditations.length === 0) return 0;
		let streak = 1;
		const sortedDates = meditations
			.map((m) => new Date(m.created_at))
			.sort((a, b) => b.getTime() - a.getTime());
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (sortedDates[0].toDateString() !== today.toDateString()) return 0;

		for (let i = 1; i < sortedDates.length; i++) {
			const prevDate = new Date(sortedDates[i - 1]);
			prevDate.setDate(prevDate.getDate() - 1);
			if (sortedDates[i].toDateString() === prevDate.toDateString()) {
				streak++;
			} else {
				break;
			}
		}
		return streak;
	}

	function handleNavigation(path: string) {
		goto(path);
	}
</script>

<svelte:head>
	<title>Dashboard - Your Mindfulness Hub</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<!-- Hero Section -->
<header class="hero-section">
	<h1>Welcome, {user.name}</h1>
	<p class="tagline">Your daily mindfulness companion</p>
</header>

<!-- Quick Stats -->
<section class="stats-section">
	<div class="stats-strip">
		<div class="stat-item">
			<i class="fas fa-clock"></i>
			<div class="stat-text">
				<h3>{totalMinutes}</h3>
				<p>Minutes</p>
			</div>
		</div>
		<div class="divider"></div>
		<div class="stat-item">
			<i class="fas fa-fire"></i>
			<div class="stat-text">
				<h3>{daysInRow}</h3>
				<p>Streak</p>
			</div>
		</div>
		<div class="divider"></div>
		<div class="stat-item">
			<i class="fas fa-headphones"></i>
			<div class="stat-text">
				<h3>{totalMeditations}</h3>
				<p>Sessions</p>
			</div>
		</div>
	</div>
</section>

<!-- Playlists Grid -->
<section class="playlists-section">
	<div class="section-header">
		<h2 class="section-title">Recommended Playlists</h2>
		<button class="view-all-btn small" on:click={() => handleNavigation('/playlists')}>
			See All
		</button>
	</div>
	<div class="playlists-list">
		{#each playlists.slice(0, 4) as playlist}
			<div
				class="playlist-item"
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

<!-- Recent Sessions -->
<section class="sessions-section">
	<div class="section-header">
		<h2 class="section-title">Recent Sessions</h2>
		{#if meditations.length > 0}
			<button class="view-all-btn small" on:click={() => handleNavigation('/library')}>
				View All ({totalMeditations})
			</button>
		{/if}
	</div>

	{#if meditations.length > 0}
		<ul class="sessions-list">
			{#each meditations as meditation (meditation.id)}
				<li>
					<div
						class="session-item"
						on:click={() => handleNavigation(`/session/${meditation.id}`)}
						on:keydown={(e) => e.key === 'Enter' && handleNavigation(`/session/${meditation.id}`)}
						tabindex="0"
						role="button"
					>
						<div class="play-button">
							<i class="fas fa-play"></i>
						</div>
						<div class="session-info">
							<h3>{meditation.title || 'Untitled Meditation'}</h3>
							<div class="session-meta">
								<span><i class="far fa-clock"></i> {meditation.length || 'N/A'} min</span>
								<span>{new Date(meditation.created_at).toLocaleDateString()}</span>
							</div>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="empty-state">
			<i class="fas fa-music"></i>
			<p>No recent sessions yet</p>
			<button class="create-btn" on:click={() => handleNavigation('/new')}>
				Create Your First Meditation
			</button>
		</div>
	{/if}
</section>

<style>
	h1,
	h2,
	h3 {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 600;
		color: var(--text-primary);
	}

	/* Hero Section */
	.hero-section {
		padding: 1.5rem 0;
		margin-bottom: 1.25rem;
	}

	.hero-section h1 {
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		margin-bottom: 0.25rem;
		color: var(--text-primary);
	}

	.tagline {
		font-size: 1rem;
		color: var(--text-secondary);
		margin: 0;
	}

	/* Section Headers */
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.section-title {
		font-size: 1.5rem;
		margin: 0;
		color: var(--text-primary);
	}

	/* Stats Section - Redesigned as a strip */
	.stats-section {
		margin-bottom: 2rem;
	}

	.stats-strip {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--background-card);
		border-radius: 12px;
		padding: 0.75rem 1.5rem;
		box-shadow: 0 2px 8px var(--ui-shadow);
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.stat-item i {
		font-size: 1.4rem;
		color: var(--icon-primary);
	}

	.stat-text {
		display: flex;
		flex-direction: column;
	}

	.stat-item h3 {
		font-size: 1.3rem;
		margin: 0;
		line-height: 1.2;
	}

	.stat-item p {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.divider {
		width: 1px;
		height: 40px;
		background-color: var(--ui-divider);
	}

	/* Playlists Section - Redesigned as a list */
	.playlists-section {
		margin-bottom: 2rem;
	}

	.playlists-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.playlist-item {
		display: flex;
		align-items: center;
		background-color: var(--background-card);
		border-radius: 12px;
		padding: 0.8rem 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px var(--ui-shadow);
	}

	.playlist-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--ui-shadowHover);
	}

	.playlist-icon {
		font-size: 1.3rem;
		color: var(--icon-primary);
		margin-right: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background-color: var(--background-cardHover);
		border-radius: 50%;
		flex-shrink: 0;
	}

	.playlist-info {
		flex-grow: 1;
		overflow: hidden;
	}

	.playlist-info h3 {
		font-size: 1rem;
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.playlist-arrow {
		font-size: 1rem;
		color: var(--icon-secondary);
		transition: transform 0.3s ease;
		margin-left: 0.75rem;
	}

	.playlist-item:hover .playlist-arrow {
		transform: translateX(3px);
		color: var(--icon-primary);
	}

	/* Sessions Section */
	.sessions-section {
		margin-bottom: 2rem;
	}

	.sessions-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.session-item {
		display: flex;
		align-items: center;
		background-color: var(--background-card);
		border-radius: 12px;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px var(--ui-shadow);
	}

	.session-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px var(--ui-shadowHover);
	}

	.play-button {
		width: 40px;
		height: 40px;
		background-color: var(--background-button);
		color: var(--text-light);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1rem;
		flex-shrink: 0;
	}

	.session-info {
		flex-grow: 1;
		overflow: hidden;
	}

	.session-info h3 {
		font-size: 1.1rem;
		margin: 0 0 0.3rem 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.session-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.session-meta i {
		margin-right: 0.3rem;
	}

	.view-all-btn {
		padding: 0.75rem 1.25rem;
		background-color: var(--background-button);
		color: var(--text-light);
		border: none;
		border-radius: 12px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.3s ease;
		text-align: center;
	}

	.view-all-btn.small {
		padding: 0.4rem 0.75rem;
		font-size: 0.8rem;
		border-radius: 8px;
	}

	.view-all-btn:hover {
		background-color: var(--background-buttonHover);
		transform: translateY(-2px);
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		background-color: var(--background-card);
		border-radius: 16px;
		box-shadow: 0 2px 8px var(--ui-shadow);
	}

	.empty-state i {
		font-size: 2rem;
		color: var(--icon-secondary);
		margin-bottom: 1rem;
	}

	.empty-state p {
		font-size: 1rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
	}

	@media (max-width: 480px) {
		.stats-strip {
			padding: 0.75rem 1rem;
		}

		.stat-item i {
			font-size: 1.25rem;
		}

		.stat-item h3 {
			font-size: 1.1rem;
		}

		.stat-item p {
			font-size: 0.7rem;
		}

		.divider {
			height: 30px;
		}
	}
</style>
