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
							<h3 class="title-wrapper">
								<span class="title-text">{meditation.title || 'Untitled Meditation'}</span>
								{#if meditation.listened}
									<span class="icon-wrapper">
										<i class="fas fa-check-circle listened-icon"></i>
									</span>
								{/if}
							</h3>
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
			<i class="fas fa-music"></i>
			<p>No meditations available.</p>
			<a href="/new" class="create-new-btn">Create Your First Meditation</a>
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
	}

	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0;
	}

	.meditation-count {
		font-size: 0.9rem;
		color: var(--text-secondary);
		background-color: var(--background-card);
		padding: 0.4rem 0.75rem;
		border-radius: 8px;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	li {
		display: flex;
		align-items: center;
		background-color: var(--background-card);
		border-radius: 12px;
		padding: 1rem;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px var(--ui-shadow);
	}

	li:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--ui-shadowHover);
	}

	li.processing {
		border: 1px dashed rgba(0, 0, 0, 0.1);
	}

	.meditation-info {
		flex-grow: 1;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
	}

	.meditation-info:hover {
		text-decoration: none;
	}

	.meditation-info h3 {
		font-size: 1.1rem;
		margin: 0 0 0.3rem 0;
		color: var(--text-primary);
	}

	.meditation-info p {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin: 0.2rem 0;
	}

	.meditation-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.meditation-meta i {
		margin-right: 0.3rem;
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
		text-decoration: none;
		transition: all 0.3s ease;
	}

	.play-button:hover {
		transform: scale(1.05);
		background-color: var(--background-buttonHover);
	}

	.processing-icon {
		width: 40px;
		height: 40px;
		background-color: var(--background-cardHover);
		color: var(--text-secondary);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1rem;
		flex-shrink: 0;
	}

	.listened-icon {
		font-size: 0.8rem;
		color: #4caf50;
		margin-left: 0.5rem;
	}

	.load-more-btn {
		width: 100%;
		padding: 0.9rem 1rem;
		background-color: var(--background-button);
		color: var(--text-light);
		border: none;
		border-radius: 12px;
		cursor: pointer;
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.load-more-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--ui-shadowHover);
	}

	.load-more-btn:disabled {
		background-color: #ccc;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		background-color: var(--background-card);
		border-radius: 12px;
		color: var(--text-secondary);
		margin-top: 1rem;
	}

	.empty-state i {
		font-size: 2rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state p {
		margin-bottom: 1.5rem;
	}

	.create-new-btn {
		display: inline-block;
		padding: 0.9rem 1.5rem;
		background-color: var(--background-button);
		color: var(--text-light);
		text-decoration: none;
		border-radius: 12px;
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.create-new-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--ui-shadowHover);
	}

	.message {
		margin-top: 1rem;
		padding: 0.75rem;
		border-radius: 12px;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.error {
		background-color: #ffebee;
		color: #c62828;
	}

	@media (max-width: 480px) {
		h1 {
			font-size: 1.6rem;
			margin-bottom: 1.2rem;
		}

		h2 {
			font-size: 1.3rem;
		}

		li {
			padding: 0.75rem;
		}

		.play-button,
		.processing-icon {
			width: 35px;
			height: 35px;
			margin-right: 0.75rem;
		}

		.meditation-info h3 {
			font-size: 1rem;
		}

		.meditation-info p,
		.meditation-meta {
			font-size: 0.8rem;
		}
	}
</style>
