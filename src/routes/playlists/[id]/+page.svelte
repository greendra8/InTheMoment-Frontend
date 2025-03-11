<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let data: PageData;

	// Animation for glow effects
	let pulseValue = 0;

	onMount(() => {
		const pulseInterval = setInterval(() => {
			pulseValue = 0.5 + Math.sin(Date.now() / 1000) * 0.5;
		}, 50);

		return () => clearInterval(pulseInterval);
	});

	function handleNavigation(href: string | null) {
		if (href) {
			goto(href);
		}
	}
</script>

<svelte:head>
	<title>{data.playlist.playlist_name} - In The Moment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<div class="neo-playlist-detail">
	<!-- Page Title -->
	<div class="page-header">
		<h1>{data.playlist.playlist_name}</h1>
		<p class="description">{data.playlist.playlist_description}</p>
	</div>

	<!-- Back Button -->
	<div class="back-nav">
		<button class="back-btn" on:click={() => handleNavigation('/playlists')}>
			<i class="fas fa-arrow-left"></i>
			<span>Back to Playlists</span>
		</button>
	</div>

	<!-- Progress Card -->
	<div class="progress-card">
		<div class="progress-icon">
			<i class="fas fa-chart-line"></i>
		</div>
		<div class="progress-info">
			<h3>Your Progress</h3>
			<div class="progress-bar-container">
				<div
					class="progress-bar"
					style="width: {Math.min(100, (data.progress.completed / data.progress.total) * 100)}%"
				></div>
			</div>
			<p class="progress-text">
				{data.progress.completed} of {data.progress.total} lessons completed
			</p>
		</div>
	</div>

	<!-- Lessons Section -->
	<section class="content-section">
		<div class="section-header">
			<h2>Lessons</h2>
		</div>

		<div class="lessons-list">
			{#each data.lessons as lesson, i (lesson.id)}
				{@const isCompleted = data.completedLessons.includes(lesson.lesson_number)}
				{@const isNextToGenerate = lesson.lesson_number === data.nextLessonToGenerate}
				{@const href = isCompleted
					? lesson.meditationId
						? `/session/${lesson.meditationId}`
						: null
					: isNextToGenerate
						? `/new?playlist=${data.playlist.id}`
						: null}
				<div
					class="lesson-card lesson-color-{i % 4}"
					class:disabled={!href}
					on:click={() => handleNavigation(href)}
					on:keydown={(e) => e.key === 'Enter' && handleNavigation(href)}
					tabindex="0"
					role="button"
				>
					<div class="lesson-number">
						<span>{lesson.lesson_number}</span>
					</div>
					<div class="lesson-info">
						<h3>{lesson.lesson_title}</h3>
					</div>
					<div class="lesson-status">
						{#if isNextToGenerate}
							<div class="lesson-action">
								<i class="fas fa-plus"></i>
								<span>Create</span>
							</div>
						{:else if isCompleted}
							<div class="lesson-completed">
								{#if lesson.meditationId}
									<i class="fas fa-headphones"></i>
									<span>Listen</span>
								{:else}
									<i class="fas fa-check-circle"></i>
									<span>Completed</span>
								{/if}
							</div>
						{:else}
							<div class="lesson-locked">
								<i class="fas fa-lock"></i>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Empty State (if no lessons) -->
	{#if data.lessons.length === 0}
		<div class="empty-state">
			<i class="fas fa-book"></i>
			<p>No lessons available in this playlist yet</p>
			<button class="action-btn" on:click={() => handleNavigation('/playlists')}>
				Back to Playlists
			</button>
		</div>
	{/if}
</div>

<style>
	/* Base Styles */
	.neo-playlist-detail {
		position: relative;
		overflow: visible;
		width: 100%;
		padding: 1.5rem 0;
	}

	/* Subtle ambient glow */
	.neo-playlist-detail::after {
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
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.1);
		margin-top: 1rem;
		margin-bottom: 0.5rem;
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
		font-size: 1.1rem;
		font-weight: 500;
	}

	p {
		color: var(--text-secondary);
		font-weight: 300;
		margin: 0;
	}

	/* Back Navigation */
	.back-nav {
		margin-bottom: 1.5rem;
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: transparent;
		color: var(--text-primary);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 12px;
		padding: 0.6rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.back-btn:hover {
		background: rgba(var(--interactive-gradient-1), 0.1);
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(var(--interactive-gradient-1), 0.1);
	}

	/* Page Header */
	.page-header {
		margin-bottom: 1.5rem;
	}

	.description {
		font-size: 1rem;
		line-height: 1.5;
		margin-top: 0.5rem;
		max-width: 90%;
	}

	/* Progress Card */
	.progress-card {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
		border-radius: 16px;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.1) 0%,
			rgba(var(--interactive-gradient-2), 0.15) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(5px);
		box-shadow: 0 4px 15px var(--ui-shadow);
	}

	.progress-icon {
		width: 50px;
		height: 50px;
		background: var(--play-btn-bg);
		color: var(--play-btn-text);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: 0 0 20px rgba(var(--interactive-gradient-1), 0.25);
		position: relative;
		z-index: 1;
		font-size: 1.2rem;
	}

	.progress-info {
		flex-grow: 1;
	}

	.progress-info h3 {
		margin-bottom: 0.8rem;
	}

	.progress-bar-container {
		height: 8px;
		background: rgba(var(--background-card-rgb), 0.5);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-bar {
		height: 100%;
		background: var(--slider-bg);
		border-radius: 4px;
		transition: width 0.5s ease;
	}

	.progress-text {
		font-size: 0.9rem;
		color: var(--text-secondary);
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

	/* Lessons List */
	.lessons-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: relative;
	}

	.lesson-card {
		display: flex;
		align-items: center;
		padding: 1.2rem;
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
		box-shadow: 0 4px 15px var(--ui-shadow);
	}

	/* light theme lesson card */
	:global(.light-theme) .lesson-card,
	:global(.light-theme) .progress-card {
		background: var(--grey-shade) !important;
	}

	.lesson-card:not(.disabled):hover {
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	.lesson-number {
		width: 36px;
		height: 36px;
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
		font-weight: 600;
		font-size: 0.9rem;
		box-shadow: 0 0 10px rgba(var(--interactive-gradient-1), 0.1);
	}

	.lesson-card:not(.disabled):hover .lesson-number {
		background: rgba(var(--interactive-gradient-1), 0.2);
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.2);
	}

	.lesson-info {
		flex-grow: 1;
		overflow: hidden;
		position: relative;
		z-index: 1;
	}

	.lesson-info h3 {
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.lesson-status {
		margin-left: auto;
		display: flex;
		align-items: center;
	}

	.lesson-action {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.8rem;
		background: var(--btn-bg);
		color: var(--btn-text);
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.3s ease;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
	}

	.lesson-card:not(.disabled):hover .lesson-action {
		background: var(--btn-bg-hover);
		transform: scale(1.05);
	}

	.lesson-completed {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.8rem;
		background: rgba(var(--interactive-gradient-1), 0.1);
		color: var(--text-primary);
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.3s ease;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.lesson-card:not(.disabled):hover .lesson-completed {
		background: rgba(var(--interactive-gradient-1), 0.15);
	}

	.lesson-locked {
		color: var(--text-secondary);
		font-size: 1.1rem;
		opacity: 0.7;
	}

	/* Card color variations */
	.lesson-color-0 {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.1) 0%,
			rgba(var(--interactive-gradient-2), 0.05) 100%
		);
	}

	.lesson-color-1 {
		background: linear-gradient(
			135deg,
			rgba(var(--gradient-3), 0.1) 0%,
			rgba(var(--gradient-4), 0.05) 100%
		);
	}

	.lesson-color-2 {
		background: linear-gradient(
			135deg,
			rgba(var(--gradient-5), 0.1) 0%,
			rgba(var(--gradient-6), 0.05) 100%
		);
	}

	.lesson-color-3 {
		background: linear-gradient(
			135deg,
			rgba(var(--gradient-7), 0.1) 0%,
			rgba(var(--gradient-8), 0.05) 100%
		);
	}

	/* Disabled state */
	.disabled {
		opacity: 0.6;
		cursor: not-allowed;
		pointer-events: none;
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
		box-shadow: 0 4px 15px var(--ui-shadow);
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

	.action-btn {
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

	.action-btn:hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(var(--interactive-gradient-1), 0.25);
	}

	/* Responsive Adjustments */
	@media (max-width: 768px) {
		.progress-card {
			padding: 1.2rem;
			gap: 1rem;
		}

		.progress-icon {
			width: 45px;
			height: 45px;
			font-size: 1rem;
		}

		.lesson-card {
			padding: 1rem;
		}

		.lesson-number {
			width: 32px;
			height: 32px;
			font-size: 0.8rem;
			margin-right: 0.8rem;
		}

		.lesson-info h3 {
			font-size: 1rem;
		}

		.lesson-action,
		.lesson-completed {
			padding: 0.4rem 0.7rem;
			font-size: 0.8rem;
		}
	}

	@media (max-width: 480px) {
		.back-nav {
			margin: 1rem 0;
		}

		.back-btn {
			padding: 0.5rem 0.8rem;
			font-size: 0.8rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.description {
			font-size: 0.9rem;
			max-width: 100%;
		}

		.progress-card {
			padding: 1rem;
			gap: 0.8rem;
		}

		.progress-icon {
			width: 40px;
			height: 40px;
			font-size: 0.9rem;
		}

		.progress-info h3 {
			font-size: 1rem;
			margin-bottom: 0.6rem;
		}

		.progress-bar-container {
			height: 6px;
		}

		.progress-text {
			font-size: 0.8rem;
		}

		.lesson-card {
			padding: 0.8rem;
		}

		.lesson-number {
			width: 28px;
			height: 28px;
			font-size: 0.75rem;
			margin-right: 0.6rem;
		}

		.lesson-info h3 {
			font-size: 0.9rem;
		}

		.lesson-action,
		.lesson-completed {
			padding: 0.3rem 0.6rem;
			font-size: 0.75rem;
		}

		.lesson-locked {
			font-size: 0.9rem;
		}
	}
</style>
