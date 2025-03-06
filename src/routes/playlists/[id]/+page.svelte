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
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="playlist-page">
	<h1>{data.playlist.playlist_name}</h1>
	<p class="playlist-description">{data.playlist.playlist_description}</p>

	<div class="section-header">
		<h2>Lessons</h2>
	</div>

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
						<p class="lesson-number">Lesson {lesson.lesson_number}</p>
					</div>
					{#if lesson.lesson_number === nextLessonNumber}
						<div class="create-button">
							<i class="fas fa-plus"></i>
							Create
						</div>
					{:else if lesson.lesson_number < nextLessonNumber}
						<div class="completed-icon">
							{#if lesson.meditationId}
								<i class="fas fa-headphones"></i>
							{:else}
								<i class="fas fa-question"></i>
							{/if}
						</div>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</div>

<style>
	.playlist-page {
		width: 100%;
		padding: 1.5rem 0;
	}

	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.playlist-description {
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		color: var(--text-secondary);
		margin-bottom: 2rem;
		line-height: 1.5;
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

	.lesson-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.lesson-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border-radius: 12px;
		padding: 1rem 1.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 2px 8px var(--ui-shadow);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.lesson-item:hover:not(.disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
	}

	.lesson-info {
		flex-grow: 1;
	}

	.lesson-info h3 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0 0 0.2rem 0;
	}

	.lesson-number {
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.create-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.75rem;
		background: var(--background-button);
		color: var(--text-light);
		border-radius: 8px;
		font-family: 'Inter', sans-serif;
		font-size: 0.8rem;
		font-weight: 500;
		transition: all 0.3s ease;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
	}

	.lesson-item:hover:not(.disabled) .create-button {
		background: var(--background-buttonHover);
	}

	/* Apply gradients only for themed versions */
	:global(.dark-theme) .create-button,
	:global(.cosmic-theme) .create-button {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), var(--interactive-opacity-1)) 0%,
			rgba(var(--interactive-gradient-2), var(--interactive-opacity-2)) 100%
		);
		color: var(--text-primary);
	}

	:global(.dark-theme) .lesson-item:hover:not(.disabled) .create-button,
	:global(.cosmic-theme) .lesson-item:hover:not(.disabled) .create-button {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), var(--interactive-hover-opacity-1)) 0%,
			rgba(var(--interactive-gradient-2), var(--interactive-hover-opacity-2)) 100%
		);
	}

	.completed-icon {
		color: var(--icon-primary);
		font-size: 1.2rem;
	}

	.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	@media (max-width: 480px) {
		.playlist-page {
			padding: 1rem 0;
		}

		.lesson-item {
			padding: 0.75rem 1rem;
		}

		.lesson-info h3 {
			font-size: 1rem;
		}

		.lesson-number {
			font-size: 0.8rem;
		}

		.create-button {
			padding: 0.3rem 0.6rem;
			font-size: 0.75rem;
		}
	}
</style>
