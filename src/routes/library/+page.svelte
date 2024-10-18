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
	<h2>Most Recent</h2>

	{#if meditations.length > 0}
		<ul>
			{#each meditations as meditation (meditation.id)}
				<li>
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
							<p>Length: {meditation.length || 'N/A'} min</p>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
		{#if currentPage < totalPages}
			<button on:click={loadMore} disabled={isLoading}>
				{isLoading ? 'Loading...' : 'Load More'}
			</button>
		{/if}
	{:else}
		<p>No meditations available.</p>
	{/if}

	{#if error}
		<p class="error">{error}</p>
	{/if}
</div>

<style>
	/* Container styles */
	.meditations-list-container {
		font-family: 'Lato', sans-serif;
		max-width: 800px;
		margin: 0;
	}

	/* Typography styles */
	h1,
	h2,
	h3 {
		font-family: 'Poppins', sans-serif;
		margin-bottom: 0.5rem;
	}

	/* List styles */
	ul {
		list-style-type: none;
		padding: 0;
	}

	li {
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		background-color: #e8e8e8;
	}

	/* Meditation info styles */
	.meditation-info {
		flex-grow: 1;
	}

	.meditation-info p {
		font-size: 0.9rem;
		color: #666;
		margin: 0;
	}

	/* Title and icon styles */
	.title-wrapper {
		font-size: 1rem;
		font-weight: 500;
		margin: 0.2rem 0;
		line-height: 1.2;
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

	/* Button styles */
	button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background-color: #333;
		color: #e1e1e1;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}

	/* Play button styles */
	.play-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 45px;
		height: 45px;
		background-color: #333;
		color: #e1e1e1;
		text-decoration: none;
		border-radius: 50%;
		margin-left: 0.5rem;
		margin-right: 1rem;
		flex-shrink: 0;
		transition:
			transform 0.1s ease-in-out,
			background-color 0.1s ease-in-out;
	}

	.play-button svg {
		width: 28px;
		height: 28px;
	}

	.play-button:active {
		background-color: #000;
		transform: scale(0.97);
		transition:
			transform 0.1s ease-in-out,
			background-color 0.1s ease-in-out;
	}

	/* Error message style */
	.error {
		color: red;
		margin-top: 1rem;
	}

	/* Responsive styles */
	@media (max-width: 600px) {
		li {
			flex-direction: row;
			align-items: center;
		}

		.play-button {
			margin-top: 0;
			align-self: center;
		}
	}
</style>
