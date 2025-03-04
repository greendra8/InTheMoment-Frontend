<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

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

	// Animation for glow effects
	let pulseValue = 0;

	onMount(() => {
		const pulseInterval = setInterval(() => {
			pulseValue = 0.5 + Math.sin(Date.now() / 1000) * 0.5;
		}, 50);

		return () => clearInterval(pulseInterval);
	});
</script>

<svelte:head>
	<title>Neo Dashboard - In The Moment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<div class="neo-dashboard">
	<!-- Hero Section with Gradient Background -->
	<div class="hero-section">
		<div class="hero-content">
			<div class="user-greeting">
				<h1>Welcome, {user.name}</h1>
				<p class="tagline">Your mindfulness journey</p>
			</div>

			<div class="hero-actions">
				<!-- Quick Action Button -->
				<button class="primary-action-btn" on:click={() => handleNavigation('/new')}>
					<i class="fas fa-plus"></i>
					<span>New Session</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Stats Cards -->
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

	<!-- Continue Listening Section (Most Recent Session) -->
	{#if meditations.length > 0}
		<section class="content-section">
			<div class="section-header">
				<h2>Continue Listening</h2>
			</div>
			<div
				class="featured-session"
				on:click={() => handleNavigation(`/session/${meditations[0].id}`)}
				on:keydown={(e) => e.key === 'Enter' && handleNavigation(`/session/${meditations[0].id}`)}
				tabindex="0"
				role="button"
			>
				<div class="featured-play-button">
					<i class="fas fa-play"></i>
				</div>
				<div class="featured-info">
					<h3>{meditations[0].title || 'Untitled Meditation'}</h3>
					<div class="featured-meta">
						<span><i class="far fa-clock"></i> {meditations[0].length || 'N/A'} min</span>
						<span class="dot-separator">•</span>
						<span>{new Date(meditations[0].created_at).toLocaleDateString()}</span>
					</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- Playlists Section -->
	<section class="content-section">
		<div class="section-header">
			<h2>Recommended Playlists</h2>
			<button class="view-all-btn" on:click={() => handleNavigation('/playlists')}>
				See All
			</button>
		</div>

		<div class="playlists-grid">
			{#each playlists.slice(0, 4) as playlist, i}
				<div
					class="playlist-card card-color-{i % 4}"
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

	<!-- Recent Sessions -->
	<section class="content-section">
		<div class="section-header">
			<h2>Recent Sessions</h2>
			{#if meditations.length > 0}
				<button class="view-all-btn" on:click={() => handleNavigation('/library')}>
					View All
				</button>
			{/if}
		</div>

		{#if meditations.length > 0}
			<div class="sessions-list">
				{#each meditations.slice(0, 3) as meditation, i (meditation.id)}
					<div
						class="session-item session-color-{i % 3}"
						on:click={() => handleNavigation(`/session/${meditation.id}`)}
						on:keydown={(e) => e.key === 'Enter' && handleNavigation(`/session/${meditation.id}`)}
						tabindex="0"
						role="button"
					>
						<div class="session-play">
							<i class="fas fa-play"></i>
						</div>
						<div class="session-info">
							<h3>{meditation.title || 'Untitled Meditation'}</h3>
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
			<div class="empty-state">
				<i class="fas fa-music"></i>
				<p>No recent sessions yet</p>
				<button class="create-btn" on:click={() => handleNavigation('/new')}>
					Create Your First Meditation
				</button>
			</div>
		{/if}
	</section>
</div>

<style>
	/* Base Styles - Note: Container width is handled by global layout */
	.neo-dashboard {
		position: relative;
		overflow: visible;
	}

	.neo-dashboard::before {
		content: '';
		position: absolute;
		top: 20%;
		right: -50%;
		width: 300px;
		height: 300px;
		background: radial-gradient(
			circle,
			rgba(var(--icon-primary-rgb), 0.03) 0%,
			rgba(var(--icon-primary-rgb), 0) 70%
		);
		border-radius: 50%;
		z-index: -1;
		pointer-events: none;
	}

	.neo-dashboard::after {
		content: '';
		position: absolute;
		bottom: 10%;
		left: -30%;
		width: 250px;
		height: 250px;
		background: radial-gradient(
			circle,
			rgba(var(--icon-primary-rgb), 0.02) 0%,
			rgba(var(--icon-primary-rgb), 0) 70%
		);
		border-radius: 50%;
		z-index: -1;
		pointer-events: none;
	}

	/* Typography */
	h1,
	h2,
	h3 {
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
	}

	h1 {
		font-size: 1.75rem;
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.2);
	}

	h2 {
		font-size: 1.25rem;
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
			rgba(var(--icon-primary-rgb), 0.8),
			rgba(var(--icon-primary-rgb), 0)
		);
		border-radius: 2px;
	}

	h3 {
		font-size: 0.95rem;
		font-weight: 500;
	}

	p {
		color: var(--text-secondary);
		font-weight: 300;
	}

	/* Hero Section with Gradient */
	.hero-section {
		margin-top: 1.5rem;
		margin-bottom: 1.5rem;
		position: relative;
		overflow: hidden;
		border-radius: 16px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.8) 0%,
			rgba(var(--background-card-rgb), 0.6) 100%
		);
		box-shadow: 0 4px 15px var(--ui-shadow);
	}

	.hero-section::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -50%;
		width: 200px;
		height: 200px;
		background: radial-gradient(
			circle,
			rgba(var(--icon-primary-rgb), 0.1) 0%,
			rgba(var(--icon-primary-rgb), 0) 70%
		);
		border-radius: 50%;
		z-index: 0;
		pointer-events: none;
	}

	.hero-section::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(var(--icon-primary-rgb), 0.8),
			transparent
		);
	}

	.hero-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		position: relative;
		z-index: 1;
	}

	.user-greeting {
		flex: 1;
	}

	.tagline {
		font-size: 0.9rem;
		margin: 0.25rem 0 0 0;
		opacity: 0.8;
	}

	.hero-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.primary-action-btn {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), var(--interactive-opacity-1)) 0%,
			rgba(var(--interactive-gradient-2), var(--interactive-opacity-2)) 100%
		);
		color: var(--text-primary);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.3);
		border-radius: 12px;
		padding: 0.6rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.2);
		position: relative;
		overflow: hidden;
	}

	.primary-action-btn::after {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(
			to right,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0.1) 50%,
			rgba(255, 255, 255, 0) 100%
		);
		transform: rotate(30deg) translateY(100%);
		transition: transform 0.6s ease;
	}

	.primary-action-btn:hover {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), var(--interactive-hover-opacity-1)) 0%,
			rgba(var(--interactive-gradient-2), var(--interactive-hover-opacity-2)) 100%
		);
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(var(--interactive-gradient-1), 0.3);
	}

	.primary-action-btn:hover::after {
		transform: rotate(30deg) translateY(-100%);
	}

	.primary-action-btn i {
		filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5));
	}

	/* Stats Container */
	.stats-container {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 0.5rem;
		border-radius: 12px;
		background: var(--background-card);
		border: 1px solid rgba(var(--icon-primary-rgb), 0.3);
		box-shadow: 0 4px 12px var(--ui-shadow);
		position: relative;
		overflow: hidden;
		text-align: center;
		backdrop-filter: blur(5px);
	}

	.stat-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: -1;
		opacity: 0.15;
		transition: opacity 0.3s ease;
	}

	/* Gradient colors that work with all themes */
	.minutes-card::before {
		background: linear-gradient(135deg, rgb(var(--gradient-1)) 0%, rgb(var(--gradient-2)) 100%);
	}

	.streak-card::before {
		background: linear-gradient(135deg, rgb(var(--gradient-3)) 0%, rgb(var(--gradient-4)) 100%);
	}

	.sessions-card::before {
		background: linear-gradient(135deg, rgb(var(--gradient-5)) 0%, rgb(var(--gradient-6)) 100%);
	}

	.card-color-0::before {
		background: linear-gradient(135deg, rgb(var(--gradient-1)) 0%, rgb(var(--gradient-2)) 100%);
	}

	.card-color-1::before {
		background: linear-gradient(135deg, rgb(var(--gradient-3)) 0%, rgb(var(--gradient-4)) 100%);
	}

	.card-color-2::before {
		background: linear-gradient(135deg, rgb(var(--gradient-5)) 0%, rgb(var(--gradient-6)) 100%);
	}

	.card-color-3::before {
		background: linear-gradient(135deg, rgb(var(--gradient-7)) 0%, rgb(var(--gradient-8)) 100%);
	}

	.session-color-0::before {
		background: linear-gradient(135deg, rgb(var(--gradient-1)) 0%, rgb(var(--gradient-2)) 100%);
	}

	.session-color-1::before {
		background: linear-gradient(135deg, rgb(var(--gradient-3)) 0%, rgb(var(--gradient-4)) 100%);
	}

	.session-color-2::before {
		background: linear-gradient(135deg, rgb(var(--gradient-5)) 0%, rgb(var(--gradient-6)) 100%);
	}

	.stat-card::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.05) 0%,
			rgba(255, 255, 255, 0) 50%
		);
		pointer-events: none;
	}

	.stat-card:hover::before {
		opacity: 0.25;
	}

	.stat-icon {
		font-size: 1rem;
		color: var(--icon-primary);
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.3);
		border-radius: 50%;
		margin-bottom: 0.4rem;
		background: rgba(var(--interactive-gradient-1), 0.1);
		box-shadow: 0 0 10px rgba(var(--interactive-gradient-1), 0.2);
		position: relative;
		z-index: 1;
	}

	.stat-icon::after {
		content: '';
		position: absolute;
		top: -2px;
		left: -2px;
		right: -2px;
		bottom: -2px;
		border-radius: 50%;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.5),
			rgba(var(--interactive-gradient-2), 0)
		);
		opacity: 0;
		z-index: -1;
		transition: opacity 0.3s ease;
	}

	.stat-card:hover .stat-icon::after {
		opacity: 0.5;
	}

	.stat-details {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}

	.stat-value {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text-primary);
		text-shadow: 0 0 10px rgba(var(--interactive-gradient-1), 0.2);
	}

	.stat-label {
		font-size: 0.7rem;
		color: var(--text-secondary);
		position: relative;
	}

	/* Content Sections */
	.content-section {
		margin-bottom: 1.5rem;
		position: relative;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.view-all-btn {
		font-size: 0.75rem;
		color: var(--icon-primary);
		background: transparent;
		border: none;
		padding: 0.3rem 0;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
	}

	.view-all-btn::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 0;
		height: 1px;
		background: var(--icon-primary);
		transition: width 0.3s ease;
	}

	.view-all-btn:hover::after {
		width: 100%;
	}

	/* Continue Listening Section */
	.featured-session {
		display: flex;
		align-items: center;
		padding: 1rem;
		border-radius: 16px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.8) 0%,
			rgba(var(--background-card-rgb), 0.6) 100%
		);
		border: 1px solid rgba(var(--icon-primary-rgb), 0.3);
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(5px);
	}

	.featured-session::before {
		content: '';
		position: absolute;
		top: -2px;
		left: -2px;
		right: -2px;
		bottom: -2px;
		background: linear-gradient(
			135deg,
			rgba(var(--icon-primary-rgb), 0.3),
			transparent,
			rgba(var(--icon-primary-rgb), 0.3),
			transparent
		);
		border-radius: 16px;
		z-index: -1;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.featured-session::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			135deg,
			rgba(var(--icon-primary-rgb), 0.05) 0%,
			rgba(var(--icon-primary-rgb), 0.1) 100%
		);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.featured-session:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px var(--ui-shadowHover);
	}

	.featured-session:hover::before {
		opacity: 0.5;
	}

	.featured-session:hover::after {
		opacity: 1;
	}

	.featured-play-button {
		width: 42px;
		height: 42px;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), var(--interactive-opacity-1)) 0%,
			rgba(var(--interactive-gradient-2), var(--interactive-opacity-2)) 100%
		);
		color: var(--text-primary);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1rem;
		flex-shrink: 0;
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.2);
		transition: all 0.3s ease;
		position: relative;
		z-index: 1;
	}

	.featured-play-button::before {
		content: '';
		position: absolute;
		top: -2px;
		left: -2px;
		right: -2px;
		bottom: -2px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(var(--icon-primary-rgb), 0.5), transparent);
		opacity: 0;
		z-index: -1;
		transition: opacity 0.3s ease;
	}

	.featured-session:hover .featured-play-button {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), var(--interactive-hover-opacity-1)) 0%,
			rgba(var(--interactive-gradient-2), var(--interactive-hover-opacity-2)) 100%
		);
		box-shadow: 0 0 20px rgba(var(--interactive-gradient-1), 0.3);
		transform: scale(1.05);
	}

	.featured-session:hover .featured-play-button::before {
		opacity: 0.5;
	}

	.featured-info {
		flex-grow: 1;
		overflow: hidden;
		position: relative;
		z-index: 1;
	}

	.featured-info h3 {
		text-shadow: 0 0 10px rgba(var(--icon-primary-rgb), 0.2);
	}

	.featured-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.3rem;
	}

	.dot-separator {
		margin: 0 0.5rem;
		opacity: 0.6;
	}

	/* Playlists Grid */
	.playlists-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		position: relative;
	}

	.playlists-grid::after {
		content: '';
		position: absolute;
		bottom: -10px;
		left: 50%;
		transform: translateX(-50%);
		width: 30%;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(var(--icon-primary-rgb), 0.2),
			transparent
		);
		border-radius: 1px;
	}

	.playlist-card {
		position: relative;
		border-radius: 12px;
		background: var(--background-card);
		border: 1px solid rgba(var(--icon-primary-rgb), 0.3);
		overflow: hidden;
		cursor: pointer;
		transition: all 0.3s ease;
		aspect-ratio: 16 / 9;
		backdrop-filter: blur(5px);
	}

	.playlist-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 0.2;
		z-index: 0;
	}

	.playlist-card:hover {
		transform: translateY(-2px) scale(1.02);
		box-shadow: 0 6px 16px var(--ui-shadowHover);
		border-color: rgba(var(--icon-primary-rgb), 0.5);
	}

	.playlist-card:hover::before {
		opacity: 0.3;
	}

	.playlist-content {
		position: relative;
		z-index: 1;
		height: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 0.75rem;
	}

	.playlist-icon {
		font-size: 1.2rem;
		color: var(--text-primary);
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 50%;
		margin-right: 0.75rem;
		flex-shrink: 0;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.playlist-icon::after {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(
			to right,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0.2) 50%,
			rgba(255, 255, 255, 0) 100%
		);
		transform: rotate(30deg) translateY(100%);
		transition: transform 0.6s ease;
	}

	.playlist-card:hover .playlist-icon {
		background: rgba(255, 255, 255, 0.25);
		box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
		transform: scale(1.05);
	}

	.playlist-card:hover .playlist-icon::after {
		transform: rotate(30deg) translateY(-100%);
	}

	.playlist-name {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-primary);
		text-align: left;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
		position: relative;
	}

	.playlist-shine {
		position: absolute;
		top: -50%;
		left: -50%;
		width: 300%;
		height: 300%;
		background: linear-gradient(
			to right,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0.1) 50%,
			rgba(255, 255, 255, 0) 100%
		);
		transform: rotate(30deg);
		transition: transform 0.5s ease;
		z-index: 0;
	}

	.playlist-card:hover .playlist-shine {
		transform: rotate(30deg) translate(50%, 50%);
	}

	/* Sessions List */
	.sessions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		position: relative;
	}

	.sessions-list::after {
		content: '';
		position: absolute;
		bottom: -10px;
		left: 50%;
		transform: translateX(-50%);
		width: 30%;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(var(--icon-primary-rgb), 0.2),
			transparent
		);
		border-radius: 1px;
	}

	.session-item {
		display: flex;
		align-items: center;
		padding: 0.75rem;
		border-radius: 12px;
		background: var(--background-card);
		border: 1px solid rgba(var(--icon-primary-rgb), 0.3);
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(5px);
	}

	.session-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 0.1;
		z-index: 0;
	}

	.session-item:hover {
		transform: translateY(-2px) scale(1.01);
		box-shadow: 0 6px 16px var(--ui-shadowHover);
		border-color: rgba(var(--icon-primary-rgb), 0.5);
	}

	.session-item:hover::before {
		opacity: 0.2;
	}

	.session-play {
		width: 36px;
		height: 36px;
		background: rgba(255, 255, 255, 0.15);
		color: var(--text-primary);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 0.75rem;
		flex-shrink: 0;
		transition: all 0.3s ease;
		position: relative;
		z-index: 1;
		overflow: hidden;
	}

	.session-play::after {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(
			to right,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0.2) 50%,
			rgba(255, 255, 255, 0) 100%
		);
		transform: rotate(30deg) translateY(100%);
		transition: transform 0.6s ease;
	}

	.session-item:hover .session-play {
		background: rgba(255, 255, 255, 0.25);
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
		transform: scale(1.05);
	}

	.session-item:hover .session-play::after {
		transform: rotate(30deg) translateY(-100%);
	}

	.session-info {
		flex-grow: 1;
		overflow: hidden;
		position: relative;
		z-index: 1;
	}

	.session-info h3 {
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
	}

	.session-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.7rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}

	.session-meta i {
		margin-right: 0.3rem;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 2rem 1rem;
		border-radius: 16px;
		background: var(--background-card);
		border: 1px solid rgba(var(--icon-primary-rgb), 0.3);
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(5px);
	}

	.empty-state::before {
		content: '';
		position: absolute;
		top: -2px;
		left: -2px;
		right: -2px;
		bottom: -2px;
		background: linear-gradient(
			135deg,
			rgba(var(--icon-primary-rgb), 0.3),
			transparent,
			rgba(var(--icon-primary-rgb), 0.3),
			transparent
		);
		border-radius: 16px;
		z-index: -1;
		opacity: 0.2;
	}

	.empty-state i {
		font-size: 1.75rem;
		color: rgba(var(--icon-primary-rgb), 0.5);
		margin-bottom: 0.75rem;
		filter: drop-shadow(0 0 5px rgba(var(--icon-primary-rgb), 0.3));
	}

	.empty-state p {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
	}

	.create-btn {
		padding: 0.6rem 1.25rem;
		font-size: 0.8rem;
		background: linear-gradient(
			135deg,
			rgba(var(--icon-primary-rgb), 0.2) 0%,
			rgba(var(--icon-primary-rgb), 0.4) 100%
		);
		color: var(--text-primary);
		border: 1px solid rgba(var(--icon-primary-rgb), 0.5);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.create-btn::after {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(
			to right,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0.1) 50%,
			rgba(255, 255, 255, 0) 100%
		);
		transform: rotate(30deg) translateY(100%);
		transition: transform 0.6s ease;
	}

	.create-btn:hover {
		background: linear-gradient(
			135deg,
			rgba(var(--icon-primary-rgb), 0.3) 0%,
			rgba(var(--icon-primary-rgb), 0.5) 100%
		);
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(var(--icon-primary-rgb), 0.3);
	}

	.create-btn:hover::after {
		transform: rotate(30deg) translateY(-100%);
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

		.playlists-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.5rem;
		}

		.playlist-icon {
			width: 30px;
			height: 30px;
			font-size: 1rem;
			margin-right: 0.5rem;
		}

		.playlist-name {
			font-size: 0.75rem;
		}

		.hero-content {
			padding: 1.25rem 1rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.tagline {
			font-size: 0.8rem;
		}
	}
</style>
