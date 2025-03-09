<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	export let sessionId: string;
	export let profileId: string;
	export let existingFeedback: string | null = null;

	let feedbackText = '';
	let initialFeedback = '';
	const dispatch = createEventDispatcher();
	let showConfirmation = false;

	$: isSubmitDisabled = feedbackText === initialFeedback;

	onMount(() => {
		feedbackText = existingFeedback || '';
		initialFeedback = feedbackText;
	});

	console.log('FeedbackForm component initialized:', { sessionId, profileId, existingFeedback });

	function handleSubmit() {
		console.log('Submitting feedback:', feedbackText);
		dispatch('submit', { sessionId, profileId, feedback: feedbackText });
		initialFeedback = feedbackText;
		showConfirmation = true;
		setTimeout(() => {
			showConfirmation = false;
		}, 3000); // Hide the confirmation after 3 seconds
	}

	function handleFocus() {
		dispatch('focus');
	}

	function handleBlur() {
		dispatch('blur');
	}

	function handleClose() {
		dispatch('close');
	}
</script>

<form on:submit|preventDefault={handleSubmit}>
	<div class="form-header">
		<h3>Shape Your Future Sessions</h3>
		<button type="button" class="close-button" on:click={handleClose}>
			<i class="fas fa-times"></i>
		</button>
	</div>
	<textarea
		bind:value={feedbackText}
		placeholder="What would you like your mentor to take into account for future sessions?"
		rows="4"
		maxlength="500"
		on:focus={handleFocus}
		on:blur={handleBlur}
	></textarea>
	<div class="button-container">
		{#if showConfirmation}
			<div class="confirmation-message" transition:fade={{ duration: 300 }}>
				<i class="fas fa-check-circle"></i>
				Feedback saved
			</div>
		{/if}
		<button type="submit" disabled={isSubmitDisabled}>Provide Feedback</button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		box-sizing: border-box;
		padding: 1.5rem;
		background: var(--background-card);
		border-radius: 1rem 1rem 0 0;
		box-shadow: 0 -4px 20px var(--ui-shadow);
		border-top: 1px solid var(--ui-border);
		color: var(--text-primary);
	}

	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	h3 {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 600;
		font-size: 1.25rem;
		margin: 0;
		color: var(--text-primary);
	}

	.close-button {
		background: none;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		font-size: 1.25rem;
		color: var(--icon-primary);
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.3s ease;
	}

	.close-button:hover {
		transform: rotate(90deg);
	}

	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--ui-border);
		border-radius: 0.5rem;
		resize: vertical;
		background-color: var(--background-input);
		color: var(--text-primary);
		box-sizing: border-box;
		font-size: 1rem;
		line-height: 1.5;
		transition: border-color 0.3s ease;
		min-height: 120px;
		font-family: 'Lato', sans-serif;
	}

	textarea:focus {
		outline: none;
		border-color: var(--ui-focus);
		box-shadow: 0 0 0 2px rgba(var(--interactive-gradient-1), 0.2);
	}

	.button-container {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 1rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		background: var(--btn-bg);
		color: var(--btn-text);
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 1rem;
		font-weight: 500;
		font-family: 'Space Grotesk', sans-serif;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.confirmation-message {
		font-size: 0.9rem;
		color: var(--ui-success);
		font-style: italic;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.confirmation-message i {
		color: var(--ui-success);
	}
</style>
