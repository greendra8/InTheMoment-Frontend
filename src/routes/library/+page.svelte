<script lang="ts">
	import { getUserMeditations } from '$lib/api';
	import type { PageData } from './$types';

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
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="currentColor"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<polygon points="10 8 16 12 10 16 10 8"></polygon>
							</svg>
						</a>
					{:else}
						<div class="processing-icon">
							<i class="fas fa-spinner fa-spin"></i>
						</div>
					{/if}
					<div class="meditation-info">
						{#if meditation.status === 'processing'}
							<!-- Display for processing meditations -->
							<h3>Processing Meditation...</h3>
							<p>
								{meditation.lesson_playlists
									? `Playlist: ${meditation.lesson_playlists.playlist_name}`
									: `Theme: ${meditation.theme || 'N/A'}`}
							</p>
							<p>Length: {meditation.length || 'N/A'} min</p>
						{:else}
							<!-- Display for completed meditations -->
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
						{/if}
					</div>
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
		<p class="error"><i class="fas fa-exclamation-circle"></i> {error}</p>
	{/if}
</div>

<style>
	h1,
	h2,
	h3 {
		font-family: 'Space Grotesk', sans-serif;
	}

	/* Container styles */
	.meditations-list-container {
		width: 100%;
		padding: 1.5rem 0;
	}

	/* Typography styles */
	h1 {
		font-size: 1.8rem;
		margin-bottom: 1.5rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	h2 {
		font-size: 1.3rem;
		font-weight: 500;
		margin: 0;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.2rem;
	}

	.meditation-count {
		font-size: 0.9rem;
		color: #666;
		background-color: #f0f0f0;
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
	}

	/* List styles */
	ul {
		list-style-type: none;
		padding: 0;
	}

	li {
		display: flex;
		align-items: center;
		margin-bottom: 0.75rem;
		padding: 0.75rem;
		border-radius: 12px;
		background-color: #e8e8e8;
		border: none;
		transition: none;
		box-shadow: none;
	}

	li:hover {
		transform: none;
		box-shadow: none;
	}

	li.processing {
		background-color: #e8e8e8;
		border: 1px dashed rgba(0, 0, 0, 0.1);
	}

	/* Meditation info styles */
	.meditation-info {
		flex-grow: 1;
	}

	.meditation-info p {
		font-size: 0.9rem;
		color: #666;
		margin: 0.2rem 0;
	}

	.meditation-meta {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
		font-size: 0.85rem;
		color: #777;
	}

	.meditation-meta i {
		margin-right: 0.3rem;
	}

	/* Title and icon styles */
	.title-wrapper {
		font-size: 1.1rem;
		font-weight: 500;
		margin: 0 0 0.4rem 0;
		line-height: 1.3;
		color: #000;
	}

	.title-text {
		display: inline;
	}

	.icon-wrapper {
		display: inline-block;
		width: 0;
		position: relative;
	}

	.listened-icon {
		font-size: 12px;
		position: absolute;
		top: -1em;
		left: 1px;
		color: #4caf50;
		white-space: nowrap;
	}

	/* Processing icon */
	.processing-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 45px;
		height: 45px;
		background-color: #f0f0f0;
		color: #777;
		border-radius: 50%;
		margin-left: 0.5rem;
		margin-right: 1rem;
		flex-shrink: 0;
	}

	.processing-icon i {
		font-size: 1.2rem;
	}

	/* Button styles */
	.load-more-btn {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background-color: #000;
		color: #fff;
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
		width: 100%;
	}

	.load-more-btn:hover {
		background-color: #222;
		transform: translateY(-2px);
	}

	.load-more-btn:disabled {
		background-color: #ccc;
		cursor: not-allowed;
		transform: none;
	}

	/* Play button styles */
	.play-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 45px;
		height: 45px;
		background-color: #000;
		color: #fff;
		text-decoration: none;
		border-radius: 50%;
		margin-left: 0.5rem;
		margin-right: 1rem;
		flex-shrink: 0;
		transition: all 0.3s ease;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
	}

	.play-button:hover {
		transform: scale(1.05);
		background-color: #222;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
	}

	.play-button svg {
		width: 24px;
		height: 24px;
	}

	.play-button:active {
		transform: scale(0.97);
	}

	/* Empty state */
	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #666;
	}

	.empty-state i {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.3;
	}

	.empty-state p {
		margin-bottom: 1.5rem;
	}

	.create-new-btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background-color: #000;
		color: #fff;
		text-decoration: none;
		border-radius: 12px;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.create-new-btn:hover {
		background-color: #222;
		transform: translateY(-2px);
	}

	/* Error message style */
	.error {
		color: #e53935;
		margin-top: 1rem;
		padding: 0.75rem;
		background-color: rgba(229, 57, 53, 0.1);
		border-radius: 12px;
		font-size: 0.9rem;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	/* Responsive styles */
	@media (max-width: 600px) {
		.meditations-list-container {
			padding: 1rem 0;
		}

		h1 {
			font-size: 1.6rem;
			margin-bottom: 1.2rem;
		}

		li {
			padding: 0.75rem;
		}

		.play-button,
		.processing-icon {
			width: 40px;
			height: 40px;
			margin-right: 0.75rem;
		}

		.play-button svg {
			width: 20px;
			height: 20px;
		}

		.title-wrapper {
			font-size: 1rem;
		}
	}
</style>
