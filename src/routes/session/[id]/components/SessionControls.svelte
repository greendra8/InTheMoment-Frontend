<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let showFeedbackForm: boolean;
	export let hasFeedback: boolean;

	const dispatch = createEventDispatcher();

	function toggleFeedbackVisibility() {
		dispatch('toggleFeedback');
	}
</script>

<div class="feedback-controls-wrapper">
	{#if showFeedbackForm}
		<button class="show-feedback-button" on:click={toggleFeedbackVisibility}>
			<i class="fas fa-comment-alt"></i>&nbsp;
			{hasFeedback ? 'View Feedback' : 'Share Feedback'}
		</button>
	{/if}
</div>

<style>
	.feedback-controls-wrapper {
		position: fixed;
		bottom: 6rem;
		left: 50%;
		transform: translate(-50%);
		width: 100%;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		z-index: 2;
	}

	/* Native app specific positioning */
	:global(.native-app) .feedback-controls-wrapper {
		padding-bottom: 5rem;
	}

	.show-feedback-button {
		padding: clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.8rem, 2.5vw, 1rem);
		font-size: clamp(0.875rem, 2.5vw, 1rem);
		font-family: 'Space Grotesk', sans-serif;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), var(--interactive-opacity-1)) 0%,
			rgba(var(--interactive-gradient-2), var(--interactive-opacity-2)) 100%
		);
		color: var(--text-primary);
		border: 2px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: clamp(0.4rem, 1.5vw, 0.5rem);
		cursor: pointer;
		transition: all 0.3s ease;
		opacity: 0.9;
	}

	.show-feedback-button:hover {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), var(--interactive-hover-opacity-1)) 0%,
			rgba(var(--interactive-gradient-2), var(--interactive-hover-opacity-2)) 100%
		);
	}

	/* Responsive Design */
	@media (max-width: 600px) {
		.feedback-controls-wrapper {
			max-width: 90%;
			bottom: 3.5rem;
			padding-left: 1rem;
			padding-right: 1rem;
			padding-bottom: 1.25rem;
		}
	}
</style>
