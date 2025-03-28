<!-- Session dialog component -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { showError } from '$lib/stores/notifications';
	import WelcomeScreen from './WelcomeScreen.svelte';
	import PreSessionDialog from './PreSessionDialog.svelte';
	import PostSessionDialog from './PostSessionDialog.svelte';
	import ExistingFeedback from './ExistingFeedback.svelte';

	const dispatch = createEventDispatcher<{
		config: {
			length: number;
			posture: string;
			eyes: string;
			conversation: Array<{ role: string; content: string }>;
			sessionType?: 'meditation' | 'hypnosis';
			hypnosisPrompt?: string;
		};
		submit: { sessionId: string; profileId: string; feedback: string; rating: number };
		skip: void;
		close: void;
		focus: void;
		blur: void;
	}>();

	// Mode: 'pre' for pre-session, 'post' for post-session feedback
	export let mode: 'pre' | 'post' = 'pre';

	// Add props for post-session feedback
	export let sessionId: string = '';
	export let profileId: string = '';
	export let existingFeedback: string | null = null;
	export let existingRating: number | null = null;

	// Add prop for first-time users
	export let isFirstSession = false;
	// Add prop for initial question from server
	export let initialQuestion = '';
	// Add prop to check if previous check-in data exists
	export let hasPreviousCheckIn = false;

	// Only show welcome screen for first-time users during pre-session
	let showWelcomeScreen = mode === 'pre' && isFirstSession;

	// Add state for existing feedback handling
	let showExistingFeedback = mode === 'post' && existingFeedback && existingFeedback.length > 0;
	let editingExistingFeedback = false;
	// Add variable for feedback handling
	let feedback = existingFeedback || '';
	let rating = existingRating || 0;

	// Function to proceed from welcome screen to check-in
	function proceedToCheckIn() {
		showWelcomeScreen = false;
	}

	// Ensure initialQuestion is provided
	if (!initialQuestion) {
		console.error('SessionDialog: initialQuestion prop is required but was not provided');
	}

	// Handle events from child components
	function handleFocus() {
		dispatch('focus');
	}

	function handleBlur() {
		dispatch('blur');
	}

	function handleConfig(event: CustomEvent) {
		dispatch('config', event.detail);
	}

	function handleSubmit(event: CustomEvent) {
		const { feedback: newFeedback, rating: newRating } = event.detail;
		feedback = newFeedback;
		rating = newRating;
		existingFeedback = newFeedback;
		existingRating = newRating;
		showExistingFeedback = true;
		dispatch('submit', event.detail);
	}

	function handleSkip() {
		dispatch('skip');
	}

	function handleClose() {
		// If we have existing feedback but aren't showing it, show it instead of closing
		if (mode === 'post' && existingFeedback && !showExistingFeedback) {
			showExistingFeedback = true;
		} else {
			dispatch('close');
		}
	}

	function handleExistingFeedbackEdit(event: CustomEvent<string>) {
		editingExistingFeedback = true;
		feedback = event.detail;
	}

	function handleExistingFeedbackSave(event: CustomEvent<string>) {
		editingExistingFeedback = false;
		feedback = event.detail;
		existingFeedback = event.detail;
		dispatch('submit', { sessionId, profileId, feedback: event.detail, rating });
	}

	function handleNewFeedback() {
		showExistingFeedback = false;
	}

	// Fix for existingRating not being passed to ExistingFeedback component
	onMount(() => {
		// If we're in post mode and have existing feedback, show it right away
		if (mode === 'post' && existingFeedback && existingFeedback.length > 0) {
			showExistingFeedback = true;
		}
	});
</script>

<div class="session-dialog" class:feedback-mode={mode === 'post'}>
	{#if showWelcomeScreen}
		<!-- Popover structure for WelcomeScreen -->
		<div class="welcome-popover-container" transition:fade={{ duration: 300 }}>
			<div class="popover-backdrop"></div>
			<div class="popover-content">
				<WelcomeScreen {proceedToCheckIn} />
			</div>
		</div>
	{/if}

	<!-- Main dialog content -->
	{#if mode === 'post' && showExistingFeedback}
		<ExistingFeedback
			existingFeedback={existingFeedback || ''}
			bind:editingExistingFeedback
			on:edit={handleExistingFeedbackEdit}
			on:save={handleExistingFeedbackSave}
			on:new={handleNewFeedback}
			on:close={handleClose}
		/>
	{:else}
		<div class="check-in-container" class:feedback-mode={mode === 'post'}>
			{#if mode === 'pre'}
				<PreSessionDialog
					{initialQuestion}
					{hasPreviousCheckIn}
					on:config={handleConfig}
					on:skip={handleSkip}
					on:focus={handleFocus}
					on:blur={handleBlur}
				/>
			{:else}
				<PostSessionDialog
					{sessionId}
					{profileId}
					{initialQuestion}
					{existingFeedback}
					{existingRating}
					on:submit={handleSubmit}
					on:close={handleClose}
					on:focus={handleFocus}
					on:blur={handleBlur}
				/>
			{/if}
		</div>
	{/if}
</div>

<style>
	.session-dialog {
		margin: 0 auto;
		padding: 1.5rem;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border-radius: 16px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		box-shadow: 0 8px 20px var(--ui-shadow);
		position: relative;
		min-height: 400px; /* Add minimum height to prevent layout shift */
		display: flex;
		flex-direction: column;
		margin-bottom: 200px; /* Add margin to accommodate debug panel */
		width: 100%;
		max-width: 500px;
		box-sizing: border-box;
		overflow-y: auto; /* Add scrolling for overflow content */
		max-height: 80vh; /* Limit height to prevent excessive stretching */
	}

	/* Styles for the WelcomeScreen Popover */
	.welcome-popover-container {
		position: fixed; /* Use fixed to overlay everything */
		inset: 0; /* Cover the whole viewport */
		z-index: 1001; /* Ensure it's above other dialog content (nav is 1000) */
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.popover-backdrop {
		position: absolute;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black */
		backdrop-filter: blur(8px); /* Background blur */
		-webkit-backdrop-filter: blur(8px); /* Safari */
	}

	.popover-content {
		position: relative; /* To be above the backdrop */
		z-index: 1; /* Above backdrop */
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.95) 0%,
			/* Slightly less transparent */ rgba(var(--background-card-rgb), 0.85) 100%
		);
		border-radius: 16px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2); /* More prominent shadow */
		max-width: 500px; /* Match the dialog width */
		width: 90%; /* Responsive width */
		max-height: 80vh; /* Limit height */
		overflow-y: auto;
		display: flex; /* Use flex for internal layout */
		flex-direction: column;
		min-height: 350px; /* Give content some minimum height */
	}

	/* Adjustments for when feedback mode is also active */
	.session-dialog.feedback-mode .welcome-popover-container {
		/* Popover already covers screen, no specific adjustment needed here */
	}

	/* Hide underlying dialog scrollbar when popover is active (might need JS for full cross-browser) */
	.session-dialog:has(.welcome-popover-container) {
		overflow: hidden;
	}
	/* End Popover Styles */

	.session-dialog.feedback-mode {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 500px;
		max-height: 80vh;
		min-height: 0;
		margin: 0;
		z-index: 999;
		display: flex;
		flex-direction: column;
		padding: 0;
	}

	.check-in-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.check-in-container.feedback-mode {
		padding: 2rem;
	}

	/* Mobile styles for feedback mode */
	@media (max-width: 768px) {
		.session-dialog.feedback-mode {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: 0;
			border-radius: 0;
			z-index: 999;
			height: 100%;
			max-height: 100%;
			width: 100%;
			max-width: 100%;
			transform: none;
			padding: 0;
		}

		.check-in-container.feedback-mode {
			/* align vertically */
			justify-content: center;
		}
	}

	/* 550px height media query */
	@media (max-height: 550px) {
		.check-in-container.feedback-mode {
			margin-top: 0;
			justify-content: flex-start;
		}
	}
</style>
