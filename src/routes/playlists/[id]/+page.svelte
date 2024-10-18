<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	export let data: PageData;

	$: nextLessonNumber = data.lastCreatedLessonNumber + 1;

	function handleNavigation(href: string | null) {
		if (href) {
			goto(href);
		}
	}
</script>

<svelte:head>
	<title>{data.playlist.playlist_name} - Course Playlist</title>
</svelte:head>

<div class="playlist-page">
	<h1>{data.playlist.playlist_name}</h1>
	<p>{data.playlist.playlist_description}</p>

	<h2>Lessons</h2>
	<ul class="lesson-list">
		{#each data.lessons as lesson (lesson.id)}
			{@const isAccessible = lesson.lesson_number <= nextLessonNumber}
			{@const href = isAccessible
				? lesson.meditationId
					? `/session/${lesson.meditationId}`
					: `/new?playlist=${data.playlist.id}`
				: null}
			<li class:disabled={!isAccessible}>
				<div
					class="lesson-item"
					class:disabled={!isAccessible}
					on:click={() => handleNavigation(href)}
					on:keydown={(e) => e.key === 'Enter' && handleNavigation(href)}
					tabindex="0"
					role="button"
				>
					<div class="lesson-info">
						<h3>{lesson.lesson_title}</h3>
						<p>Lesson {lesson.lesson_number}</p>
					</div>
					{#if lesson.lesson_number === nextLessonNumber}
						<div class="create-button">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<line x1="12" y1="5" x2="12" y2="19"></line>
								<line x1="5" y1="12" x2="19" y2="12"></line>
							</svg>
							Create
						</div>
					{:else if lesson.lesson_number < nextLessonNumber}
						<div class="completed-icon">
							{#if lesson.meditationId}
								<i class="fa-solid fa-headphones"></i>
							{:else}
								?
							{/if}
						</div>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</div>

<style>
	h1,
	h2,
	h3 {
		font-family: 'Poppins', sans-serif;
		margin-bottom: 0.5rem;
	}

	.lesson-list {
		list-style-type: none;
		padding: 0;
	}

	.lesson-list li {
		margin-bottom: 0.5rem;
	}

	.lesson-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		text-decoration: none;
		color: #333;
		padding: 0.5rem;
		border-radius: 10px;
		box-shadow: 0 4px 6px #0000001a;
		border: 1px solid #706b5780;
		transition:
			background-color 0.3s,
			transform 0.3s;
		cursor: pointer;
	}

	.lesson-item:hover:not(.disabled) {
		background-color: #e0e0e0;
	}

	.lesson-item:active:not(.disabled) {
		filter: brightness(0.97);
		transform: scale(0.98);
	}

	.lesson-info {
		flex-grow: 1;
	}

	.lesson-info h3 {
		font-size: 1rem;
		margin: 0;
	}

	.lesson-info p {
		font-size: 0.8rem;
		color: #666;
		margin: 0;
	}

	.create-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.2rem 0.4rem;
		background-color: #333;
		color: #e1e1e1;
		border-radius: 3px;
		font-size: 0.8rem;
		min-width: 60px;
		white-space: nowrap;
	}

	.create-button svg {
		margin-right: 0.2rem;
		width: 14px;
		height: 14px;
	}

	.completed-icon {
		color: #333;
		font-size: 1.2rem;
		margin-right: 0.5rem;
	}

	.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.disabled:hover {
		background-color: #f0f0f0 !important;
	}
</style>
