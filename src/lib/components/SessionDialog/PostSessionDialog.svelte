<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import { transcribeAudio, processFeedbackConversation } from '$lib/api';
	import { fade } from 'svelte/transition';
	import { crossfade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { showError } from '$lib/stores/notifications';
	import ConversationInterface from './ConversationInterface.svelte';

	const dispatch = createEventDispatcher<{
		submit: { sessionId: string; profileId: string; feedback: string };
		close: void;
		focus: void;
		blur: void;
	}>();

	export let sessionId: string = '';
	export let profileId: string = '';
	export let initialQuestion = '';
	export let existingFeedback: string | null = null;

	// UI state
	let inputMode: 'conversation' | 'text' = 'conversation';
	let isRecording = false;
	let isProcessing = false;
	let isThinking = false;
	let waitingForQuestion = false;
	let messages: Array<{ role: string; content: string }> = [
		{ role: 'assistant', content: initialQuestion }
	];
	let currentQuestion = initialQuestion;
	let questionKey = 0;
	let showFinalMessage = false;
	let finalMessage = '';
	let savedFeedback = existingFeedback;

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

	// Debug information
	let debugInfo = {
		lastTranscription: '',
		showDebug: false
	};

	// Toggle debug panel
	function toggleDebug() {
		debugInfo.showDebug = !debugInfo.showDebug;
	}

	// Handle conversation input (voice or text)
	async function handleConversationInput(event: CustomEvent<Blob | string>) {
		const input = event.detail;

		if (input === 'ERROR_ACCESSING_MICROPHONE') {
			showError("We couldn't access your microphone. You can try using text input instead.");
			inputMode = 'text';
			return;
		}

		isProcessing = true;
		isThinking = true;

		try {
			let response: string;

			if (input instanceof Blob) {
				console.log('Transcribing audio...');
				try {
					response = await transcribeAudio(input);
					// Save transcription for debugging
					debugInfo.lastTranscription = response;
					console.log('Whisper transcription:', response);
				} catch (transcriptionError) {
					console.error('Transcription error after retries:', transcriptionError);
					isThinking = false;
					showError(
						"We couldn't process your audio. The system tried multiple times but failed. Please try again or use text input."
					);
					isProcessing = false;
					return;
				}
			} else {
				response = input;
			}

			// Add user's response to messages
			messages = [...messages, { role: 'user', content: response }];

			// If we have over 15 messages, just dispatch a default feedback
			if (messages.length > 15) {
				console.log('Message limit reached, dispatching default feedback');
				const defaultFeedback = 'I enjoyed this session. It was relaxing and helpful.';
				dispatch('submit', { sessionId, profileId, feedback: defaultFeedback });
				return;
			}

			// Get AI response
			console.log('Processing feedback conversation...');
			try {
				const aiResponse = await processFeedbackConversation(messages, sessionId);
				console.log('AI response:', aiResponse);
				isThinking = false;

				// Check if it's a final feedback marker
				const feedbackMatch =
					aiResponse.match(/```feedback\s*([\s\S]*?)\s*```/) ||
					aiResponse.match(/FINAL_FEEDBACK:\s*([\s\S]*?)$/);

				if (feedbackMatch) {
					const feedbackText = feedbackMatch[1].trim();

					// Add the AI's final message to the conversation
					messages = [...messages, { role: 'assistant', content: aiResponse }];
					finalMessage =
						"Thanks for your feedback! We'll use this to improve your future sessions.";
					showFinalMessage = true;

					// Wait a moment to show the final message before dispatching the feedback
					setTimeout(() => {
						console.log('Final feedback:', feedbackText);
						savedFeedback = feedbackText; // Save the feedback locally
						dispatch('submit', { sessionId, profileId, feedback: feedbackText });
						// DON'T automatically close - let the parent component handle this
					}, 5000);
					return;
				}

				// If we get here, it's not a final response with feedback
				questionKey++; // Increment key to trigger transition
				currentQuestion = aiResponse;
				messages = [...messages, { role: 'assistant', content: aiResponse }];
			} catch (aiError) {
				console.error('AI feedback error after retries:', aiError);
				isThinking = false;
				showError(
					"We couldn't get a response from our AI system after multiple attempts. Let's try again or try a different way to share your feedback."
				);
			}
		} catch (error) {
			console.error('Error processing response:', error);
			showError(
				"Something went wrong. We tried multiple times but couldn't complete your request. Let's try again."
			);
		} finally {
			isProcessing = false;
		}
	}

	function handleSkip() {
		// Instead of closing, dispatch an event to show existing feedback
		dispatch('submit', { sessionId, profileId, feedback: existingFeedback || '' });
	}

	function handleFocus() {
		dispatch('focus');
	}

	function handleBlur() {
		dispatch('blur');
	}

	// Direct feedback submission for when user edits existing feedback
	function handleDirectFeedbackSubmit(feedback: string) {
		dispatch('submit', { sessionId, profileId, feedback });
	}
</script>

<div class="content-container">
	{#if showFinalMessage}
		<div
			class="final-message"
			in:receive={{ key: 'final-message' }}
			out:send={{ key: 'final-message' }}
		>
			<p>{finalMessage}</p>
			<div class="spinner">
				<i class="fas fa-circle-notch fa-spin"></i>
				<span>Saving your feedback...</span>
			</div>
		</div>
	{:else}
		<div
			class="content-wrapper"
			in:receive={{ key: 'main-content' }}
			out:send={{ key: 'main-content' }}
		>
			<div class="session-header">
				<!-- Mode toggle -->
				<div class="mode-toggle">
					<button
						class:active={inputMode === 'conversation'}
						on:click={() => {
							if (inputMode === 'text') inputMode = 'conversation';
						}}
					>
						<i class="fas fa-microphone"></i> Voice
					</button>
					<button
						class:active={inputMode === 'text'}
						on:click={() => {
							if (inputMode === 'conversation') inputMode = 'text';
						}}
					>
						<i class="fas fa-keyboard"></i> Text
					</button>
				</div>
			</div>

			<ConversationInterface
				bind:inputMode
				{isRecording}
				{isProcessing}
				{isThinking}
				{waitingForQuestion}
				{currentQuestion}
				{questionKey}
				on:submit={handleConversationInput}
				on:focus={handleFocus}
				on:blur={handleBlur}
			/>

			<div class="session-footer">
				<!-- Changed to show existing feedback instead of closing -->
				<button class="skip-btn" on:click={handleSkip} disabled={isProcessing}>
					<i class="fas fa-arrow-right"></i>
					Keep existing feedback
				</button>

				<!-- Debug toggle button -->
				{#if import.meta.env.DEV}
					<button class="debug-btn" on:click={toggleDebug} title="Toggle debug info">
						<i class="fas fa-bug"></i>
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Debug panel -->
{#if debugInfo.showDebug}
	<div class="debug-panel" in:fade={{ duration: 200 }}>
		<h3>Debug Information</h3>
		<div class="debug-section">
			<h4>Last Whisper Transcription:</h4>
			<pre>{debugInfo.lastTranscription || 'No transcription yet'}</pre>
		</div>
		<div class="debug-section">
			<h4>Recording State:</h4>
			<pre>isRecording: {isRecording}, waitingForQuestion: {waitingForQuestion}</pre>
		</div>
		<div class="debug-section">
			<h4>Conversation:</h4>
			<div class="conversation-log">
				{#each messages as message, i}
					<div class="message {message.role}">
						<strong>{message.role}:</strong>
						{message.content}
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.content-container {
		position: relative;
		min-height: 350px;
		width: 100%;
	}

	.content-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
	}

	.session-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.mode-toggle {
		display: flex;
		gap: 0.75rem;
		width: 100%;
		margin-bottom: 0.5rem;
	}

	.mode-toggle i {
		margin-right: 0.5rem;
	}

	.mode-toggle button {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-secondary);
		font-family: 'Inter', sans-serif;
	}

	.mode-toggle button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 10px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
	}

	.mode-toggle button.active {
		background: var(--btn-bg);
		color: var(--btn-text);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
	}

	/* Final message */
	.final-message {
		text-align: center;
		padding: 1.5rem;
		margin: 1rem 0 2rem;
		min-height: 150px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(var(--interactive-gradient-1), 0.05);
		border-radius: 12px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.final-message p {
		font-size: 1.1rem;
		line-height: 1.5;
		margin: 0 0 1.5rem;
		color: var(--text-primary);
		font-style: italic;
		font-family: 'Inter', sans-serif;
	}

	.final-message .spinner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
	}

	.final-message .spinner i {
		color: rgba(var(--interactive-gradient-1), 0.7);
		font-size: 1.2rem;
	}

	.session-footer {
		margin-top: 2.5rem;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
	}

	.skip-btn {
		padding: 0.6rem 1.2rem;
		border-radius: 12px;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.3s ease;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.skip-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 10px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		color: var(--text-primary);
	}

	.skip-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.debug-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.debug-btn:hover {
		color: var(--text-primary);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		transform: translateY(-2px);
		box-shadow: 0 4px 10px var(--ui-shadowHover);
	}

	.debug-panel {
		position: absolute;
		left: 0;
		right: 0;
		bottom: -450px; /* Position below the main content */
		margin-top: 1.5rem;
		padding: 1.5rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border-radius: 12px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		color: var(--text-primary);
		font-size: 0.85rem;
		font-family: 'Inter', sans-serif;
		z-index: 1;
	}

	.debug-panel h3 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
		color: var(--text-primary);
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 600;
	}

	.debug-section {
		margin-bottom: 1.5rem;
	}

	.debug-section h4 {
		margin: 0 0 0.5rem;
		font-size: 0.95rem;
		color: var(--text-secondary);
		font-family: 'Inter', sans-serif;
		font-weight: 500;
	}

	.debug-section pre {
		background: rgba(0, 0, 0, 0.2);
		padding: 0.75rem;
		border-radius: 8px;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-word;
		font-family: 'Consolas', monospace;
		font-size: 0.8rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.conversation-log {
		max-height: 200px;
		overflow-y: auto;
		background: rgba(0, 0, 0, 0.2);
		padding: 0.75rem;
		border-radius: 8px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.message {
		padding: 0.75rem;
		margin-bottom: 0.75rem;
		border-radius: 8px;
		font-size: 0.85rem;
	}

	.message.user {
		background: rgba(var(--interactive-gradient-1), 0.1);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.message.assistant {
		background: rgba(var(--interactive-gradient-2), 0.1);
		border: 1px solid rgba(var(--interactive-gradient-2), 0.1);
	}
</style>
