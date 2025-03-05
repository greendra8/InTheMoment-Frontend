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
			</div>

			<div class="hero-bottom-row">
				<p class="tagline">Your mindfulness journey</p>

				<div class="hero-actions">
					<!-- Quick Action Button -->
					<button class="primary-action-btn" on:click={() => handleNavigation('/new')}>
						<i class="fas fa-plus"></i>
						<span>New Session</span>
					</button>
				</div>
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

	/* Subtle ambient glow */
	.neo-dashboard::after {
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
		font-size: 2rem;
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.1);
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

	/* Hero Section with Gradient */
	.hero-section {
		margin-top: 2rem;
		margin-bottom: 2rem;
		position: relative;
		overflow: hidden;
		border-radius: 16px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		box-shadow: 0 4px 20px var(--ui-shadow);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
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
			rgba(var(--interactive-gradient-1), 0.3),
			transparent
		);
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		padding: 2rem;
		position: relative;
		z-index: 1;
	}

	.user-greeting {
		width: 100%;
		margin-bottom: 0;
	}

	.hero-bottom-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		width: 100%;
	}

	.tagline {
		font-size: 1rem;
		margin: 0;
		opacity: 0.8;
	}

	.hero-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.primary-action-btn {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), var(--interactive-opacity-1)) 0%,
			rgba(var(--interactive-gradient-2), var(--interactive-opacity-2)) 100%
		);
		color: var(--text-primary);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 12px;
		padding: 0.6rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.15);
		position: relative;
		overflow: hidden;
	}

	.primary-action-btn:hover {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), var(--interactive-hover-opacity-1)) 0%,
			rgba(var(--interactive-gradient-2), var(--interactive-hover-opacity-2)) 100%
		);
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(var(--interactive-gradient-1), 0.25);
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
		backdrop-filter: blur(5px);
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
		text-shadow: 0 0 10px rgba(var(--interactive-gradient-1), 0.2);
	}

	.stat-label {
		font-size: 0.8rem;
		color: var(--text-secondary);
		position: relative;
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

	/* Continue Listening Section */
	.featured-session {
		display: flex;
		align-items: center;
		padding: 1.2rem;
		border-radius: 16px;
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
	}

	.featured-session:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	.featured-play-button {
		width: 48px;
		height: 48px;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.4) 0%,
			rgba(var(--interactive-gradient-2), 0.4) 100%
		);
		color: var(--text-primary);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1.2rem;
		flex-shrink: 0;
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.2);
		transition: all 0.3s ease;
		position: relative;
		z-index: 1;
	}

	.featured-session:hover .featured-play-button {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.7) 0%,
			rgba(var(--interactive-gradient-2), 0.8) 100%
		);
		box-shadow: 0 0 20px rgba(var(--interactive-gradient-1), 0.3);
		transform: scale(1.05);
	}

	.featured-info {
		flex-grow: 1;
		overflow: hidden;
		position: relative;
		z-index: 1;
	}

	.featured-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-top: 0.4rem;
	}

	.dot-separator {
		margin: 0 0.6rem;
		opacity: 0.7;
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
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		overflow: hidden;
		cursor: pointer;
		transition: all 0.3s ease;
		aspect-ratio: 16 / 9;
		backdrop-filter: blur(5px);
	}

	.playlist-card:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	.playlist-content {
		position: relative;
		z-index: 1;
		height: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 1rem;
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
		margin-right: 1rem;
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
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-primary);
		text-align: left;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(5px);
	}

	.session-item:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	.session-play {
		width: 40px;
		height: 40px;
		background: rgba(var(--interactive-gradient-1), 0.15);
		color: var(--text-primary);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1rem;
		flex-shrink: 0;
		transition: all 0.3s ease;
		position: relative;
		z-index: 1;
		box-shadow: 0 0 10px rgba(var(--interactive-gradient-1), 0.1);
	}

	.session-item:hover .session-play {
		background: rgba(var(--interactive-gradient-1), 0.2);
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.2);
		transform: scale(1.05);
	}

	.session-info {
		flex-grow: 1;
		overflow: hidden;
		position: relative;
		z-index: 1;
	}

	.session-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-top: 0.3rem;
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
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.6) 0%,
			rgba(var(--interactive-gradient-2), 0.7) 100%
		);
		color: var(--text-primary);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.create-btn:hover {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.7) 0%,
			rgba(var(--interactive-gradient-2), 0.8) 100%
		);
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(var(--interactive-gradient-1), 0.25);
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

		.hero-bottom-row {
			flex-direction: row;
			justify-content: space-between;
			align-items: flex-end;
		}

		.tagline {
			font-size: 0.8rem;
			max-width: 60%;
		}

		.primary-action-btn {
			padding: 0.5rem 0.8rem;
			font-size: 0.8rem;
		}

		h1 {
			font-size: 1.5rem;
		}
	}
</style>
