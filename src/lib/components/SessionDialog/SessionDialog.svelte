<!-- Session dialog component -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { crossfade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
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
		submit: { sessionId: string; profileId: string; feedback: string };
		skip: void;
		close: void;
		focus: void;
		blur: void;
	}>();

	// Set up crossfade transition
	const [send, receive] = crossfade({
		duration: 400,
		easing: cubicInOut,
		fallback(node) {
			return {
				duration: 400,
				easing: cubicInOut,
				css: (t) => `opacity: ${t}`
			};
		}
	});

	// Mode: 'pre' for pre-session, 'post' for post-session feedback
	export let mode: 'pre' | 'post' = 'pre';

	// Add props for post-session feedback
	export let sessionId: string = '';
	export let profileId: string = '';
	export let existingFeedback: string | null = null;

	// Add prop for first-time users
	export let isFirstSession = false;
	// Add prop for initial question from server
	export let initialQuestion = '';
	// Add prop to check if previous check-in data exists
	export let hasPreviousCheckIn = false;

	// Add state to track if welcome screen is shown
	let showWelcomeScreen = isFirstSession;

	// Add state for existing feedback handling
	let showExistingFeedback = mode === 'post' && existingFeedback && existingFeedback.length > 0;
	let editingExistingFeedback = false;
	// Add variable for feedback handling
	let feedback = existingFeedback || '';

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
		const { feedback: newFeedback } = event.detail;
		feedback = newFeedback;
		existingFeedback = newFeedback;
		showExistingFeedback = true;
		dispatch('submit', event.detail);
	}

	function handleSkip() {
		dispatch('skip');
	}

	function handleClose() {
		dispatch('close');
	}

	function handleExistingFeedbackEdit(event: CustomEvent<string>) {
		editingExistingFeedback = true;
		feedback = event.detail;
	}

	function handleExistingFeedbackSave(event: CustomEvent<string>) {
		editingExistingFeedback = false;
		feedback = event.detail;
		existingFeedback = event.detail;
		dispatch('submit', { sessionId, profileId, feedback: event.detail });
	}

	function handleNewFeedback() {
		showExistingFeedback = false;
	}
</script>

<div class="session-dialog" class:feedback-mode={mode === 'post'}>
	{#if mode === 'post' && showExistingFeedback}
		<ExistingFeedback
			existingFeedback={existingFeedback || ''}
			bind:editingExistingFeedback
			on:edit={handleExistingFeedbackEdit}
			on:save={handleExistingFeedbackSave}
			on:new={handleNewFeedback}
			on:close={handleClose}
		/>
	{:else if showWelcomeScreen}
		<WelcomeScreen {mode} {proceedToCheckIn} />
	{:else}
		<div
			class="check-in-container"
			class:feedback-mode={mode === 'post'}
			in:receive={{ key: 'check-in' }}
			out:send={{ key: 'check-in' }}
		>
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
	}

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
			margin-top: -80px;
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
