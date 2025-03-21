<script lang="ts">
	import { slide } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	export let isOpen: boolean;
	export let isDownloaded: boolean;
	export let meditationId: string;
	export let userId: string;
	export let listened: boolean;
	export let meditationLength: number;
	export let isCompletedThisSession: boolean;

	const dispatch = createEventDispatcher();

	function handleDownload() {
		if (!isDownloaded) {
			dispatch('triggerDownload');
		}
	}

	function handleToggleCompletion() {
		const currentStatus = listened || isCompletedThisSession;
		dispatch('toggleCompletion', {
			meditationId,
			userId,
			length: meditationLength,
			currentStatus
		});
	}
</script>

{#if isOpen}
	<div class="menu" transition:slide={{ duration: 300 }}>
		<ul>
			<li
				on:click|stopPropagation={handleDownload}
				aria-label={isDownloaded ? 'Meditation downloaded' : 'Download meditation'}
			>
				<i class="fas {isDownloaded ? 'fa-check-circle' : 'fa-download'}"></i>
				{isDownloaded ? 'Already downloaded' : 'Download'}
			</li>
			<li on:click|stopPropagation={handleToggleCompletion}>
				<i class="fas {listened || isCompletedThisSession ? 'fa-check-circle' : 'fa-check'}"></i>
				{listened || isCompletedThisSession ? 'Mark as incomplete' : 'Mark as complete'}
			</li>
		</ul>
	</div>
{/if}

<style>
	/* Dropdown Menu */
	.menu {
		position: absolute;
		top: clamp(4rem, 9vw, 4.5rem);
		right: clamp(1rem, 3vw, 1.5rem);
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border-radius: 16px;
		box-shadow: 0 4px 20px var(--ui-shadow);
		z-index: 10;
		overflow: hidden;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.menu ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.menu li {
		padding: clamp(0.8rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem);
		font-size: clamp(0.875rem, 2.5vw, 1rem);
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.menu li:not(:last-child)::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 10%;
		width: 80%;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(var(--interactive-gradient-1), 0.3),
			transparent
		);
	}

	.menu li:hover {
		background-color: var(--background-cardHover);
	}
</style>
