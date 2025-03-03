<!-- A floating notification that shows meditation generation status -->
<script lang="ts">
	import { meditationGeneration } from '$lib/stores/meditationGeneration';
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { onDestroy, onMount } from 'svelte';
	import { subscribeMeditationStatus } from '$lib/api';

	let unsubscribe: (() => void) | null = null;

	// Subscribe to status updates when meditation ID changes
	$: if ($meditationGeneration.meditationId && $meditationGeneration.isGenerating) {
		if (unsubscribe) unsubscribe();
		unsubscribe = subscribeMeditationStatus($meditationGeneration.meditationId, (status) => {
			meditationGeneration.updateStatus(status);
			if (status === 'Completed') {
				meditationGeneration.completeGeneration();
			} else if (status === 'Failed') {
				meditationGeneration.failGeneration();
			}
		});
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	function getStatusMessage(status: string): string {
		switch (status) {
			case 'Queued':
			case '':
				return 'Your meditation is in the queue...';
			case 'Fetching':
				return 'Fetching meditation details...';
			case 'Scripting':
				return 'Crafting your personalized meditation script...';
			case 'Reviewing':
				return 'Reviewing your meditation script...';
			case 'Audio Generation':
				return 'Generating your meditation audio...';
			case 'Processing':
				return 'Processing your meditation...';
			case 'Uploading':
				return 'Uploading your meditation...';
			case 'Saving':
				return 'Saving your meditation...';
			case 'Completed':
				return 'Your meditation is ready!';
			case 'Failed':
				return 'Meditation generation failed. Please try again.';
			default:
				return 'Starting your generation...';
		}
	}

	function handleClick() {
		if ($meditationGeneration.status === 'Completed' && $meditationGeneration.meditationId) {
			const meditationId = $meditationGeneration.meditationId;
			// Reset the store state before navigation
			meditationGeneration.reset();
			// Clean up subscription
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}
			// Navigate to the session
			goto(`/session/${meditationId}`);
		}
	}
</script>

{#if $meditationGeneration.isGenerating || $meditationGeneration.status === 'Completed' || $meditationGeneration.status === 'Failed'}
	<div
		class="notification"
		class:completed={$meditationGeneration.status === 'Completed'}
		class:failed={$meditationGeneration.status === 'Failed'}
		on:click={handleClick}
		transition:fly={{ y: 50, duration: 300 }}
	>
		<div class="content">
			{#if $meditationGeneration.isGenerating}
				<i class="fas fa-spinner fa-spin"></i>
			{:else if $meditationGeneration.status === 'Completed'}
				<i class="fas fa-check-circle"></i>
			{:else}
				<i class="fas fa-exclamation-circle"></i>
			{/if}
			<span>{getStatusMessage($meditationGeneration.status)}</span>
		</div>
		{#if $meditationGeneration.status === 'Completed'}
			<div class="action">Click to view →</div>
		{/if}
	</div>
{/if}

<style>
	.notification {
		position: fixed;
		top: 2rem;
		right: 2rem;
		background: var(--background-card);
		padding: 1rem 1.5rem;
		border-radius: 12px;
		box-shadow: 0 4px 12px var(--ui-shadow);
		display: flex;
		align-items: center;
		gap: 1rem;
		z-index: 1000;
		cursor: default;
		border: 1px solid rgba(0, 0, 0, 0.1);
		max-width: 90vw;
	}

	.notification.completed {
		background: var(--background-button);
		color: var(--text-light);
		cursor: pointer;
	}

	.notification.failed {
		background: #e53935;
		color: white;
	}

	.content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.content i {
		font-size: 1.1rem;
	}

	.content span {
		font-size: 0.9rem;
		font-weight: 500;
	}

	.action {
		font-size: 0.8rem;
		opacity: 0.9;
		padding-left: 0.75rem;
		border-left: 1px solid rgba(255, 255, 255, 0.2);
	}

	@media (max-width: 480px) {
		.notification {
			bottom: calc(
				4.5rem + env(safe-area-inset-bottom, 1rem)
			); /* Account for nav bar + safe area */
			right: 1rem;
			left: 1rem;
			max-width: unset;
		}
	}
</style>
