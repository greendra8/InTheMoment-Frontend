<script lang="ts">
	import { getUserMeditations } from '$lib/api';
	import type { PageData } from './$types';
	import { text, background, ui, icon } from '$lib/theme';

	export let data: PageData;

	let meditations = data.meditations || [];
	let currentPage = data.currentPage;
	let totalPages = data.totalPages;
	let limit = data.limit;
	let totalCount = data.totalCount;
	let isLoading = false;
	let error = '';

	async function loadMore() {
		isLoading = true;
		error = '';
		try {
			const newMeditations = await getUserMeditations(data.session.user.id, currentPage + 1, limit);
			console.log('newMeditations', newMeditations);
			if (newMeditations.length) {
				meditations = [...meditations, ...newMeditations];
				currentPage += 1;
			}
		} catch (err) {
			console.error('Error loading more meditations:', err);
			error = 'Failed to load more meditations. Please try again.';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Your Library</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="meditations-list-container">
	<h1>Your Library</h1>
	<div class="section-header">
		<h2>Most Recent</h2>
		{#if meditations.length > 0}
			<span class="meditation-count">{totalCount} meditation{totalCount !== 1 ? 's' : ''}</span>
		{/if}
	</div>

	{#if meditations.length > 0}
		<ul>
			{#each meditations as meditation (meditation.id)}
				<li class:processing={meditation.status === 'processing'}>
					{#if meditation.status !== 'processing'}
						<a href="/session/{meditation.id}" class="play-button">
							<i class="fas fa-play"></i>
						</a>
						<a href="/session/{meditation.id}" class="meditation-info">
							<div class="title-wrapper">
								<h3 class="title-text">{meditation.title || 'Untitled Meditation'}</h3>
								<div class="icon-wrapper">
									{#if meditation.listened}
										<i class="fas fa-check-circle listened-icon"></i>
									{/if}
									<span
										class="content-type-badge"
										class:hypnosis={meditation.content_type === 'hypnosis'}
									>
										{meditation.content_type === 'hypnosis' ? 'Hypnosis' : 'Meditation'}
									</span>
								</div>
							</div>
							<p>
								{meditation.lesson_playlists
									? `Playlist: ${meditation.lesson_playlists.playlist_name}`
									: `Theme: ${meditation.theme || 'N/A'}`}
							</p>
							<div class="meditation-meta">
								<span class="length"
									><i class="far fa-clock"></i> {meditation.length || 'N/A'} min</span
								>
								<span class="date">{new Date(meditation.created_at).toLocaleDateString()}</span>
							</div>
						</a>
					{:else}
						<div class="processing-icon">
							<i class="fas fa-spinner fa-spin"></i>
						</div>
						<div class="meditation-info">
							<h3>Processing Meditation...</h3>
							<p>
								{meditation.lesson_playlists
									? `Playlist: ${meditation.lesson_playlists.playlist_name}`
									: `Theme: ${meditation.theme || 'N/A'}`}
							</p>
							<p>Length: {meditation.length || 'N/A'} min</p>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
		{#if currentPage < totalPages}
			<button on:click={loadMore} disabled={isLoading} class="load-more-btn">
				{#if isLoading}
					<i class="fas fa-spinner fa-spin"></i> Loading...
				{:else}
					Load More
				{/if}
			</button>
		{/if}
	{:else}
		<div class="empty-state">
			<div class="welcome-message">
				<i class="fas fa-headphones-alt pulse-icon"></i>
				<h3>Your Library is Empty</h3>
				<p>Start your mindfulness journey by creating your first meditation</p>
			</div>

			<div class="onboarding-options">
				<div
					class="onboarding-card"
					on:click={() => (window.location.href = '/playlists')}
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
					on:click={() => (window.location.href = '/new')}
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
			</div>
		</div>
	{/if}

	{#if error}
		<div class="message error">
			<i class="fas fa-exclamation-circle"></i>
			{error}
		</div>
	{/if}
</div>

<style>
	.meditations-list-container {
		width: 100%;
		padding: 1.5rem 0;
		position: relative;
	}

	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 2rem;
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.1);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		position: relative;
	}

	.section-header::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 0;
		width: 30px;
		height: 2px;
		background: linear-gradient(
			90deg,
			rgba(var(--interactive-gradient-1), 0.6),
			rgba(var(--interactive-gradient-1), 0)
		);
		border-radius: 2px;
	}

	h2 {
		font-family: 'Poppins', sans-serif;
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0;
		letter-spacing: -0.3px;
	}

	.meditation-count {
		font-size: 0.9rem;
		color: var(--text-secondary);
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.1) 0%,
			rgba(var(--interactive-gradient-2), 0.05) 100%
		);
		padding: 0.4rem 0.75rem;
		border-radius: 8px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		backdrop-filter: blur(5px);
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	li {
		display: flex;
		align-items: center;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border-radius: 12px;
		padding: 0.9rem;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px var(--ui-shadow);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(5px);
	}

	/* Add subtle variations to list items */
	li:nth-child(4n + 1)::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			135deg,
			rgba(var(--gradient-1), 0.1),
			rgba(var(--gradient-2), 0.05)
		);
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: 0;
	}

	li:nth-child(4n + 2)::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			135deg,
			rgba(var(--gradient-3), 0.1),
			rgba(var(--gradient-4), 0.05)
		);
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: 0;
	}

	li:nth-child(4n + 3)::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			135deg,
			rgba(var(--gradient-5), 0.1),
			rgba(var(--gradient-6), 0.05)
		);
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: 0;
	}

	li:nth-child(4n + 4)::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			135deg,
			rgba(var(--gradient-7), 0.1),
			rgba(var(--gradient-8), 0.05)
		);
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: 0;
	}

	li:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	li:hover::before {
		opacity: 1;
	}

	.play-button {
		width: 40px;
		height: 40px;
		background: var(--background-button);
		color: var(--text-light);
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
		text-decoration: none;
	}

	li:hover .play-button {
		background: var(--background-buttonHover);
		box-shadow: 0 0 20px rgba(var(--interactive-gradient-1), 0.3);
		transform: scale(1.05);
	}

	/* Apply gradients only for themed versions */
	:global(.dark-theme) .play-button,
	:global(.cosmic-theme) .play-button {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.4) 0%,
			rgba(var(--interactive-gradient-2), 0.4) 100%
		);
		color: var(--text-primary);
	}

	:global(.dark-theme) li:hover .play-button,
	:global(.cosmic-theme) li:hover .play-button {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.7) 0%,
			rgba(var(--interactive-gradient-2), 0.8) 100%
		);
	}

	/* Add subtle shine effect */
	li::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 50%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
		transform: skewX(-25deg);
		transition: all 0.75s ease;
	}

	li:hover::after {
		left: 100%;
	}

	.meditation-info {
		flex-grow: 1;
		text-decoration: none;
		color: var(--text-primary);
		position: relative;
		z-index: 1;
	}

	.title-wrapper {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0 0 0.3rem 0;
	}

	.title-text {
		font-size: 1rem;
		font-weight: 500;
		margin: 0;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.icon-wrapper {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.listened-icon {
		color: var(--ui-success);
		font-size: 0.9rem;
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

	.meditation-info p {
		color: var(--text-secondary);
		margin: 0.3rem 0;
		font-size: 0.85rem;
	}

	.meditation-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.3rem;
	}

	.length i {
		margin-right: 0.3rem;
	}

	.processing-icon {
		width: 40px;
		height: 40px;
		background: rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1rem;
		color: var(--text-primary);
		font-size: 1rem;
	}

	.load-more-btn {
		width: 100%;
		padding: 0.9rem 1rem;
		margin-top: 1.5rem;
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: 'Inter', sans-serif;
	}

	.load-more-btn:hover:not(:disabled) {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--ui-shadowHover);
	}

	.load-more-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

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
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
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
		font-weight: 600;
		color: var(--text-primary);
	}

	.welcome-message p {
		font-size: 0.9rem;
		max-width: 80%;
		margin: 0 auto 0.5rem;
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

	h4 {
		font-size: 0.95rem;
		font-weight: 600;
		margin: 0 0 0.2rem 0;
		color: var(--text-primary);
	}

	.onboarding-content p {
		font-size: 0.8rem;
		margin: 0;
		opacity: 0.8;
		color: var(--text-secondary);
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

	.create-new-btn {
		display: inline-block;
		padding: 0.8rem 1.5rem;
		font-size: 0.9rem;
		background: var(--background-button);
		color: var(--text-light);
		text-decoration: none;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 12px;
		transition: all 0.3s ease;
	}

	.create-new-btn:hover {
		background: var(--background-buttonHover);
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(var(--interactive-gradient-1), 0.25);
	}

	/* Apply gradients only for themed versions */
	:global(.dark-theme) .create-new-btn,
	:global(.cosmic-theme) .create-new-btn {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.6) 0%,
			rgba(var(--interactive-gradient-2), 0.7) 100%
		);
		color: var(--text-primary);
	}

	:global(.dark-theme) .create-new-btn:hover,
	:global(.cosmic-theme) .create-new-btn:hover {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.7) 0%,
			rgba(var(--interactive-gradient-2), 0.8) 100%
		);
	}

	.message.error {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 12px;
		background: var(--background-error);
		color: var(--text-error);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	@media (max-width: 480px) {
		.meditations-list-container {
			padding: 1.5rem 0;
		}

		h1 {
			font-size: 1.75rem;
			margin-bottom: 1.5rem;
		}

		h2 {
			font-size: 1.25rem;
		}

		li {
			padding: 0.8rem;
		}

		.play-button {
			width: 36px;
			height: 36px;
			margin-right: 0.8rem;
		}

		.title-wrapper {
			font-size: 0.95rem;
			gap: 0.4rem;
		}

		.content-type-badge {
			font-size: 0.65rem;
			padding: 0.15rem 0.4rem;
		}

		.meditation-info p {
			font-size: 0.8rem;
		}

		.meditation-meta {
			font-size: 0.7rem;
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
	}
</style>
