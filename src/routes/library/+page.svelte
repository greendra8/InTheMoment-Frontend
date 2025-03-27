<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { text, background, ui, icon } from '$lib/theme';
	import { onMount } from 'svelte';

	export let data: PageData;

	// Track all loaded meditations
	let allMeditations: any[] = [];

	// Track the last filter applied to detect changes
	let lastAppliedFilter = data.activeFilter || 'all';

	// Use reactive statements to update local variables when data changes
	$: currentPage = data.currentPage;
	$: totalPages = data.totalPages;
	$: limit = data.limit;
	$: totalCount = data.totalCount;
	$: activeFilter = data.activeFilter || 'all';

	// Reset allMeditations when the filter changes
	$: if (activeFilter !== lastAppliedFilter) {
		allMeditations = [...data.meditations];
		lastAppliedFilter = activeFilter;
	} else {
		// Only update allMeditations when data.meditations changes and filter hasn't changed
		if (data.currentPage === 1) {
			// On page 1, always replace all meditations
			allMeditations = [...data.meditations];
		} else if (data.meditations && data.meditations.length > 0) {
			// On subsequent pages, append new meditations
			const newMeditations = data.meditations.filter(
				(newMed) => !allMeditations.some((existingMed) => existingMed.id === newMed.id)
			);
			if (newMeditations.length > 0) {
				allMeditations = [...allMeditations, ...newMeditations];
			}
		}
	}

	let isLoading = false;
	let error = '';

	async function loadMore() {
		if (isLoading || currentPage >= totalPages) return;

		isLoading = true;
		error = '';

		try {
			const newPage = currentPage + 1;
			const url = new URL(window.location.href);
			url.searchParams.set('page', newPage.toString());

			// Navigate to the new URL to load more with the same filter
			await goto(url.toString(), {
				replaceState: true,
				noScroll: true,
				keepFocus: true
			});
		} catch (err) {
			console.error('Error loading more meditations:', err);
			error = 'Failed to load more meditations. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	async function applyFilter(filter: 'all' | 'meditation' | 'hypnosis') {
		if (filter === activeFilter) return;

		isLoading = true;
		try {
			const url = new URL(window.location.href);

			// Reset to page 1 when changing filters
			url.searchParams.set('page', '1');

			if (filter === 'all') {
				url.searchParams.delete('contentType');
			} else {
				url.searchParams.set('contentType', filter);
			}

			await goto(url.toString());
		} catch (err) {
			console.error('Error applying filter:', err);
			error = 'Failed to apply filter. Please try again.';
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
		{#if allMeditations.length > 0}
			<span class="meditation-count">{totalCount} session{totalCount !== 1 ? 's' : ''}</span>
		{/if}
	</div>

	{#if totalCount > 0}
		<div class="filter-buttons">
			<button
				class="filter-btn"
				class:active={activeFilter === 'all'}
				on:click={() => applyFilter('all')}
			>
				All
			</button>
			<button
				class="filter-btn"
				class:active={activeFilter === 'meditation'}
				on:click={() => applyFilter('meditation')}
			>
				Meditations
			</button>
			<button
				class="filter-btn"
				class:active={activeFilter === 'hypnosis'}
				on:click={() => applyFilter('hypnosis')}
			>
				Hypnosis
			</button>
		</div>

		{#if allMeditations.length === 0}
			<div class="empty-filter-message">
				<p>No {activeFilter === 'meditation' ? 'meditation' : 'hypnosis'} sessions found.</p>
			</div>
		{:else}
			<ul>
				{#each allMeditations as meditation, index (meditation.id)}
					<a href="/session/{meditation.id}" class="session-link">
						<li
							class:processing={meditation.status === 'processing'}
							class:featured={index === 0 && allMeditations.length > 1}
							style="--bg-pattern: url('{meditation.bgPattern}')"
						>
							{#if meditation.status !== 'processing'}
								<div class="play-button">
									<i class="fas fa-play"></i>
								</div>
								<div class="meditation-info">
									<div class="title-wrapper">
										<h3 class="title-text">{meditation.title || 'Untitled Meditation'}</h3>
										<div class="icon-wrapper">
											{#if meditation.listened && index !== 0}
												<i class="fas fa-check-circle listened-icon"></i>
											{/if}
											{#if index !== 0}
												<span
													class="content-type-badge"
													class:hypnosis={meditation.content_type === 'hypnosis'}
												>
													{meditation.content_type === 'hypnosis' ? 'Hypnosis' : 'Meditation'}
												</span>
											{/if}
										</div>
									</div>
									{#if index === 0 && allMeditations.length > 1}
										{#if meditation.listened}
											<i class="fas fa-check-circle listened-icon"></i>
										{/if}
										<span
											class="content-type-badge"
											class:hypnosis={meditation.content_type === 'hypnosis'}
										>
											{meditation.content_type === 'hypnosis' ? 'Hypnosis' : 'Meditation'}
										</span>
									{/if}
									<p class="meditation-description">
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
								</div>
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
					</a>
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
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.session-link {
		text-decoration: none;
		color: inherit;
		display: block;
		width: 100%;
		cursor: pointer;
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
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		box-shadow: 0 4px 15px var(--ui-shadow);
		border: 1px solid var(--fixed-card-border);
		position: relative;
		overflow: hidden;
	}

	li.featured {
		flex-direction: column;
		padding: 1.5rem;
		text-align: center;
		margin-bottom: 0.5rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
	}

	li:hover {
		background: var(--fixed-card-bg);
		border-color: var(--fixed-card-border-hover);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	li.featured:hover {
		transform: translateY(-2px);
	}

	li.featured::before {
		width: 100%;
		opacity: 0.3;
		mask-image: none;
	}

	li.featured .play-button {
		margin: 0 auto 1.2rem;
		width: 50px;
		height: 50px;
		font-size: 1.2rem;
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.4);
	}

	li.featured .meditation-info {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}

	li.featured .listened-icon {
		position: absolute;
		top: -75px;
		right: 0;
		font-size: 1.1rem;
	}

	li.featured .title-wrapper {
		margin-bottom: 0.6rem;
		justify-content: center;
	}

	li.featured .title-text {
		font-size: 1.2rem;
		text-align: center;
	}

	li.featured .meditation-meta {
		justify-content: center;
		margin-top: 0.8rem;
	}

	li.featured .content-type-badge {
	}

	li.featured .meditation-description {
		display: none;
	}

	li:hover {
		background: var(--fixed-card-bg);
		border-color: var(--fixed-card-border-hover);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	/* Background pattern styling */
	li::before {
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

	li:hover::before {
		opacity: 0.25;
	}

	.play-button {
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
		text-decoration: none;
	}

	.session-link:hover .play-button {
		background: var(--fixed-play-button-hover);
		transform: scale(1.05);
		box-shadow: 0 0 8px rgba(var(--interactive-gradient-1), 0.6);
	}

	.meditation-info {
		flex-grow: 1;
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
		width: 80%;
		padding: 0.9rem 1rem;
		margin: 1.5rem auto 0 auto;
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			background 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: 'Inter', sans-serif;
	}

	.load-more-btn:hover:not(:disabled) {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
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
		animation: pulse 3s infinite ease-in-out;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
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
		background: rgba(var(--interactive-gradient-1), 0.1);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		text-align: left;
		position: relative;
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
		transition: transform 0.2s ease;
		position: relative;
		z-index: 1;
	}

	.onboarding-card:hover .onboarding-icon {
		background: rgba(var(--interactive-gradient-1), 0.25);
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

	.filter-buttons {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.filter-btn {
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 500;
		background: var(--background-card);
		color: var(--text-secondary);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		cursor: pointer;
		transition:
			background 0.2s ease,
			border-color 0.2s ease;
	}

	.filter-btn:hover {
		background: rgba(var(--interactive-gradient-1), 0.1);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
	}

	.filter-btn.active {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.2) 0%,
			rgba(var(--interactive-gradient-2), 0.3) 100%
		);
		color: var(--text-primary);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 2px 8px rgba(var(--interactive-gradient-1), 0.15);
	}

	.empty-filter-message {
		text-align: center;
		padding: 2rem 0;
		color: var(--text-secondary);
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

		li.featured {
			padding: 1.2rem;
		}

		li.featured .play-button {
			width: 45px;
			height: 45px;
			margin-bottom: 1rem;
		}

		li.featured .title-text {
			font-size: 1.1rem;
		}

		li.featured .listened-icon {
			top: -65px;
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

		.filter-buttons {
			gap: 0.3rem;
			margin-bottom: 1.2rem;
		}

		.filter-btn {
			padding: 0.4rem 0.8rem;
			font-size: 0.75rem;
		}
	}
</style>
