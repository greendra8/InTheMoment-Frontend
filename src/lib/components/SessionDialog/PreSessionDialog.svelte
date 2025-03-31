<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import { transcribeAudio, getSessionRecommendation } from '$lib/api';
	import { fade } from 'svelte/transition';
	import { crossfade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import { showError } from '$lib/stores/notifications';
	import ConversationInterface from './ConversationInterface.svelte';

	const dispatch = createEventDispatcher<{
		config: {
			length: number;
			posture: string;
			eyes: string;
			conversation: Array<{ role: string; content: string }>;
			sessionType?: 'meditation' | 'hypnosis';
			hypnosisPrompt?: string;
		};
		skip: void;
		focus: void;
		blur: void;
	}>();

	export let initialQuestion = '';
	export let hasPreviousCheckIn = false;

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

			// If we have over 15 messages, just dispatch a default response
			if (messages.length > 15) {
				console.log('Message limit reached, dispatching default response');
				// Default session config for pre-session mode
				const defaultConfig = {
					length: 10, // 10 minute default
					posture: 'sitting',
					eyes: 'closed',
					conversation: messages,
					sessionType: 'meditation' as const
				};
				dispatch('config', defaultConfig);
				return;
			}

			// Get current local time in 12-hour format
			const now = new Date();
			const localTime = now.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});

			// Get AI response
			console.log('Getting AI recommendation...');
			try {
				const aiResponse = await getSessionRecommendation(messages, localTime);
				console.log('AI response:', aiResponse);
				isThinking = false;

				// Try to parse as JSON to check if it's the final configuration
				try {
					const jsonMatch =
						aiResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
						aiResponse.match(/(\{[\s\S]*"length"[\s\S]*"posture"[\s\S]*"eyes"[\s\S]*\})/);

					if (jsonMatch) {
						const jsonStr = jsonMatch[1] || jsonMatch[0];
						let config;

						try {
							config = JSON.parse(jsonStr);
						} catch (parseError) {
							console.error('Error parsing JSON:', parseError);
							showError("We couldn't prepare your session. Let's try again.");
							isProcessing = false;
							return;
						}

						// Check for required fields in the config
						if (config && config.length && config.posture && config.eyes) {
							// Extract only the text part before the JSON if it exists
							const textPart = aiResponse.split(/```json|{/)[0].trim();

							// Add the AI's final message (without JSON) to the conversation
							if (textPart) {
								messages = [...messages, { role: 'assistant', content: textPart }];
								finalMessage = textPart.replace(/:/g, '!');
								showFinalMessage = true;

								// Wait a moment to show the final message before closing
								setTimeout(() => {
									// Create the final config object with sessionType and hypnosisPrompt if available
									const finalConfig = {
										...config,
										conversation: messages,
										// Default to meditation if sessionType is not specified
										sessionType: config.sessionType || 'meditation'
									};

									// Log the final configuration
									console.log('Final session configuration:', finalConfig);

									dispatch('config', finalConfig);
								}, 5000);
							} else {
								// Create the final config object with sessionType and hypnosisPrompt if available
								const finalConfig = {
									...config,
									conversation: messages,
									// Default to meditation if sessionType is not specified
									sessionType: config.sessionType || 'meditation'
								};

								// Log the final configuration
								console.log('Final session configuration:', finalConfig);

								dispatch('config', finalConfig);
							}
							return;
						}
					}

					// If we get here, it's not a final response with valid JSON
					questionKey++; // Increment key to trigger transition
					currentQuestion = aiResponse;
					messages = [...messages, { role: 'assistant', content: aiResponse }];
				} catch (error) {
					console.error('Error processing AI response:', error);
					// Not JSON or error parsing, so it's a follow-up question
					questionKey++; // Increment key to trigger transition
					currentQuestion = aiResponse;
					messages = [...messages, { role: 'assistant', content: aiResponse }];
				}
			} catch (aiError) {
				console.error('AI recommendation error after retries:', aiError);
				isThinking = false;
				showError(
					"We couldn't get a response from our AI system after multiple attempts. Let's try again or try a different question."
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
		dispatch('skip');
	}

	function handleFocus() {
		dispatch('focus');
	}

	function handleBlur() {
		dispatch('blur');
	}
</script>

{#if showFinalMessage}
	<div class="content-container">
		<div
			class="final-message"
			in:receive={{ key: 'final-message' }}
			out:send={{ key: 'final-message' }}
		>
			<p>{finalMessage}</p>
			<div class="spinner">
				<i class="fas fa-circle-notch fa-spin"></i>
				<span>Configuring your session...</span>
			</div>
		</div>
	</div>
{:else}
	<div class="session-header">
		<!-- Info Icon -->
		<div class="info-icon-container">
			<i class="fas fa-info-circle info-icon"></i>
			<div class="tooltip">
				Your responses help tailor the upcoming session. This conversation is not stored
				persistently in its raw form after the session is configured, but summaries may be stored to
				help personalise future sessions.
			</div>
		</div>
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
		<button class="skip-btn" on:click={handleSkip} disabled={isProcessing}>
			<i class="fas fa-arrow-right"></i>
			{#if hasPreviousCheckIn}
				Continue with previous check-in
			{:else}
				Skip to manual configuration
			{/if}
		</button>

		<!-- Debug toggle button -->
		{#if import.meta.env.DEV}
			<button class="debug-btn" on:click={toggleDebug} title="Toggle debug info">
				<i class="fas fa-bug"></i>
			</button>
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
{/if}

<style>
	.session-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		position: relative; /* Needed for absolute positioning of info icon */
		padding-top: 1.5rem; /* Add padding to make space for the icon */
	}

	.info-icon-container {
		position: absolute;
		top: -6px;
		right: 0rem; /* Adjust as needed */
		display: inline-block;
		z-index: 2; /* Ensure it's above other elements if needed */
	}

	.info-icon {
		font-size: 1.2rem;
		color: var(--text-secondary);
		cursor: help;
		transition: color 0.2s ease;
	}

	.info-icon:hover {
		color: var(--text-primary);
	}

	.tooltip {
		visibility: hidden;
		width: 280px; /* Adjusted width */
		background-color: rgba(var(--background-card-rgb), 0.95);
		color: var(--text-primary);
		text-align: center;
		border-radius: 6px;
		padding: 8px 12px;
		position: absolute;
		z-index: 1;
		right: 0;
		top: 130%;
		opacity: 0;
		transition: opacity 0.3s;
		font-size: 0.8rem;
		line-height: 1.4;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		pointer-events: none; /* Prevents tooltip from interfering with hover */
		transform-origin: top right;
		transform: translateY(-5px);
		transition:
			opacity 0.3s,
			transform 0.3s;
	}

	.info-icon-container:hover .tooltip {
		visibility: visible;
		opacity: 1;
		transform: translateY(0);
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

	/* Content container for final message */
	.content-container {
		display: flex;
		flex-direction: column;
		min-height: 350px;
		width: 100%;
	}

	/* Final message */
	.final-message {
		text-align: center;
		padding: 1.5rem;
		margin: auto 0;
		min-height: 150px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.05) 0%,
			rgba(var(--interactive-gradient-2), 0.1) 100%
		);
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
