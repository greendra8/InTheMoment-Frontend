<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { browser } from '$app/environment';

	export let data: PageData;

	$: ({ meditations, totalMeditations, playlists, user, inProgressMeditation } = data);

	// For Continue Listening section
	$: displayedMeditation = inProgressMeditation || (meditations.length > 0 ? meditations[0] : null);

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
	<title>Dashboard - In The Moment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="neo-dashboard">
	<!-- Hero Section with Gradient Background -->
	<div class="hero-section">
		<div class="hero-content">
			<div class="user-greeting">
				<h1>Welcome, {user.name === 'User' ? 'Student' : user.name}</h1>
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

	{#if meditations.length > 0}
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
	{/if}

	<!-- New User Onboarding (shown when no meditations exist) -->
	{#if meditations.length === 0}
		<section class="content-section">
			<div class="empty-state">
				<div class="welcome-message">
					<i class="fas fa-spa pulse-icon"></i>
					<h3>Welcome to Your Mindfulness Journey</h3>
					<p>Start your first meditation to begin tracking your progress</p>
				</div>

				<div class="onboarding-options">
					<div
						class="onboarding-card"
						on:click={() => handleNavigation('/playlists')}
						on:keydown={(e) => e.key === 'Enter' && handleNavigation('/playlists')}
						tabindex="0"
						role="button"
					>
						<div class="onboarding-icon">
							<i class="fas fa-play-circle"></i>
						</div>
						<div class="onboarding-content">
							<h4>Start a Guided Session</h4>
							<p>Choose from our curated playlists</p>
						</div>
						<i class="fas fa-chevron-right arrow-icon"></i>
					</div>

					<div
						class="onboarding-card"
						on:click={() => handleNavigation('/new')}
						on:keydown={(e) => e.key === 'Enter' && handleNavigation('/new')}
						tabindex="0"
						role="button"
					>
						<div class="onboarding-icon">
							<i class="fas fa-microphone-alt"></i>
						</div>
						<div class="onboarding-content">
							<h4>Create Custom Meditation</h4>
							<p>Design your own mindfulness experience</p>
						</div>
						<i class="fas fa-chevron-right arrow-icon"></i>
					</div>

					<div
						class="onboarding-card"
						on:click={() => handleNavigation('/profile')}
						on:keydown={(e) => e.key === 'Enter' && handleNavigation('/profile')}
						tabindex="0"
						role="button"
					>
						<div class="onboarding-icon">
							<i class="fas fa-sliders-h"></i>
						</div>
						<div class="onboarding-content">
							<h4>Customize Your Experience</h4>
							<p>Choose your mentor's voice and app theme</p>
						</div>
						<i class="fas fa-chevron-right arrow-icon"></i>
					</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- Continue Listening Section (Most Recent Session) -->
	{#if meditations.length > 0}
		<section class="content-section">
			<div class="section-header">
				<h2>{inProgressMeditation ? 'Continue Listening' : 'Recent Session'}</h2>
			</div>
			<div
				class="featured-session"
				on:click={() => handleNavigation(`/session/${displayedMeditation.id}`)}
				on:keydown={(e) =>
					e.key === 'Enter' && handleNavigation(`/session/${displayedMeditation.id}`)}
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
					class="playlist-card"
					style="--bg-pattern: url('{playlist.bgPattern}')"
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
</div>

<style>
	/* Base Styles - Note: Container width is handled by global layout */
	.neo-dashboard {
		position: relative;
		overflow: visible;
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

	h4 {
		font-size: 0.95rem;
		font-weight: 600;
		margin: 0 0 0.2rem 0;
		color: var(--text-primary);
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
		background: var(--btn-bg);
		color: var(--btn-text);
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
		background: var(--btn-bg-hover);
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

	.content-type-icon {
		color: var(--text-secondary);
		font-size: 0.8rem;
		opacity: 0.7;
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

	/* Ensure all badges have the same style regardless of where they appear */
	.featured-session .content-type-badge,
	.session-item .content-type-badge,
	.playlist-card .content-type-badge {
		background: var(--meditation-badge-bg);
		color: var(--meditation-badge-text);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.featured-session .content-type-badge.hypnosis,
	.session-item .content-type-badge.hypnosis,
	.playlist-card .content-type-badge.hypnosis {
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
	}

	.playlist-card:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	/* Background pattern for playlist cards */
	.playlist-card::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		width: 100%;
		background-position: center;
		background-size: cover;
		background-image: var(--bg-pattern);
		opacity: 0.15;
		z-index: 0;
		mask-image: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 30%, rgba(0, 0, 0, 0.2) 100%);
		-webkit-mask-image: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 30%, rgba(0, 0, 0, 0.2) 100%);
		transition: opacity 0.3s ease;
	}

	.playlist-card:hover::before {
		opacity: 0.25;
	}

	.playlist-content {
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

	/* Ensure consistent badge styling in session info */
	.session-info .content-type-badge {
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

	.session-info .content-type-badge.hypnosis {
		background: var(--hypnosis-badge-bg);
		color: var(--hypnosis-badge-text);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.session-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-top: 0.3rem;
	}

	/* Empty State - Enhanced for New Users */
	.empty-state {
		text-align: center;
		padding: 2rem 1.5rem;
		border-radius: 16px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Simple empty state for Recent Sessions section */
	.simple-empty-state {
		text-align: center;
		padding: 2.5rem 1.5rem;
		display: block;
		gap: 0;
	}

	.simple-empty-state i {
		font-size: 2rem;
		color: rgba(var(--icon-primary-rgb), 0.6);
		margin-bottom: 1rem;
		filter: drop-shadow(0 0 5px rgba(var(--icon-primary-rgb), 0.2));
	}

	.simple-empty-state p {
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

	.welcome-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.welcome-message i {
		font-size: 2rem;
		color: var(--icon-primary);
		margin-bottom: 1rem;
		filter: drop-shadow(0 0 5px rgba(var(--icon-primary-rgb), 0.2));
	}

	.welcome-message h3 {
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
	}

	.welcome-message p {
		font-size: 0.9rem;
		max-width: 80%;
		margin: 0 auto;
	}

	.pulse-icon {
		animation: pulse 2s infinite ease-in-out;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 0.8;
		}
		50% {
			transform: scale(1.1);
			opacity: 1;
		}
		100% {
			transform: scale(1);
			opacity: 0.8;
		}
	}

	.onboarding-options {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		width: 100%;
	}

	.onboarding-card {
		display: flex;
		align-items: center;
		padding: 1rem;
		border-radius: 12px;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.08) 0%,
			rgba(var(--interactive-gradient-2), 0.12) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: left;
		position: relative;
		overflow: hidden;
	}

	.onboarding-card:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	.onboarding-icon {
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
		position: relative;
		z-index: 1;
		box-shadow: 0 0 10px rgba(var(--interactive-gradient-1), 0.1);
	}

	.onboarding-card:hover .onboarding-icon {
		background: rgba(var(--interactive-gradient-1), 0.25);
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.2);
		transform: scale(1.05);
	}

	.onboarding-content {
		flex-grow: 1;
		overflow: hidden;
	}

	.onboarding-content p {
		font-size: 0.8rem;
		margin: 0;
		opacity: 0.8;
	}

	.arrow-icon {
		color: var(--icon-secondary);
		font-size: 0.8rem;
		margin-left: 0.5rem;
		transition: transform 0.3s ease;
	}

	.onboarding-card:hover .arrow-icon {
		transform: translateX(3px);
		color: var(--icon-primary);
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

		.empty-state {
			padding: 1.5rem 1rem;
		}

		.welcome-message h3 {
			font-size: 1.1rem;
		}

		.welcome-message p {
			font-size: 0.8rem;
		}

		.onboarding-card {
			padding: 0.8rem;
		}

		.onboarding-icon {
			width: 32px;
			height: 32px;
			margin-right: 0.8rem;
		}

		.onboarding-content h4 {
			font-size: 0.85rem;
		}

		.onboarding-content p {
			font-size: 0.75rem;
		}

		.simple-empty-state {
			padding: 1.5rem 1rem;
		}

		.simple-empty-state p {
			font-size: 0.9rem;
		}

		.create-btn {
			padding: 0.6rem 1.2rem;
			font-size: 0.8rem;
		}

		/* Featured session mobile improvements */
		.featured-session {
			padding: 1rem;
		}

		.featured-play-button {
			width: 45px;
			height: 45px;
			margin-right: 1rem;
			font-size: 1rem;
		}

		.featured-info h3 {
			font-size: 1rem;
			line-height: 1.3;
		}

		.title-row {
			gap: 0.4rem;
		}

		.featured-meta {
			font-size: 0.8rem;
		}

		.content-type-badge {
			font-size: 0.65rem;
			padding: 0.15rem 0.4rem;
		}

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
	}
</style>
