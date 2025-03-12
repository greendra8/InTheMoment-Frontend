<!-- Pre-session check-in component -->
<script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { transcribeAudio, getSessionRecommendation } from '$lib/api';
	import { fade, crossfade } from 'svelte/transition';
	import { quintOut, cubicInOut } from 'svelte/easing';

	const dispatch = createEventDispatcher<{
		config: {
			length: number;
			posture: string;
			eyes: string;
			conversation: Array<{ role: string; content: string }>;
		};
		skip: void;
	}>();

	// UI state
	let mode: 'conversation' | 'text' = 'conversation';
	let isRecording = false;
	let isProcessing = false;
	let isThinking = false;
	let audioLevel = 0;
	let textResponse = '';

	// List of possible initial questions
	const initialQuestions = [
		'How have you felt since the last time you meditated?',
		'What brings you to meditation today?',
		'What have you been up to today?',
		'What are you going to do after this session?',
		'Whats on your mind as you prepare to meditate?',
		'How has your day been going so far?',
		"What are you hoping to experience in today's session?",
		'How is your body feeling right now?',
		'What emotions are present for you in this moment?',
		"What would you like to focus on in today's practice?",
		"Is there anything specific you'd like to let go of today?"
	];

	// Get a random question from the list
	function getRandomQuestion(): string {
		const randomIndex = Math.floor(Math.random() * initialQuestions.length);
		return initialQuestions[randomIndex];
	}

	let currentQuestion = getRandomQuestion();
	let messages: Array<{ role: string; content: string }> = [];
	let showFinalMessage = false;
	let finalMessage = '';
	let interfaceActive = false;
	let waitingForQuestion = false;
	let audioChunks: Blob[] = [];
	let questionKey = 0; // For transition animations
	let buttonState = 'initial'; // Track button state for animations: 'initial', 'recording', 'waiting'
	let showTickIcon = false; // Track if we should show the tick icon on hover

	// Audio recording
	let mediaRecorder: MediaRecorder | null = null;
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let audioStream: MediaStream | null = null;
	let animationFrameId: number | null = null;

	// Debug information
	let debugInfo = {
		lastTranscription: '',
		showDebug: false
	};

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

	// Set up faster crossfade for icons
	const [sendIcon, receiveIcon] = crossfade({
		duration: 150,
		easing: cubicInOut,
		fallback(node) {
			return {
				duration: 150,
				easing: cubicInOut,
				css: (t) => `opacity: ${t}`
			};
		}
	});

	// Toggle debug panel
	function toggleDebug() {
		debugInfo.showDebug = !debugInfo.showDebug;
	}

	// Toggle between conversation and text modes
	function toggleMode() {
		if (mode === 'conversation') {
			stopRecording();
			mode = 'text';
		} else {
			mode = 'conversation';
			interfaceActive = false;
			buttonState = 'initial';
		}
	}

	onMount(() => {
		// Ensure proper cleanup of all resources when component is destroyed
		return () => {
			stopRecording();

			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}

			if (audioContext && audioContext.state !== 'closed') {
				audioContext.close().catch((err) => console.error('Error closing AudioContext:', err));
			}

			if (audioStream) {
				audioStream.getTracks().forEach((track) => track.stop());
				audioStream = null;
			}
		};
	});

	// Analyze audio levels for visualization
	function analyzeAudio() {
		if (!analyser) return;

		const dataArray = new Uint8Array(analyser.frequencyBinCount);

		function updateAudioLevel() {
			if (!analyser) {
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
					animationFrameId = null;
				}
				return;
			}

			analyser.getByteFrequencyData(dataArray);

			// Calculate average level more efficiently
			let sum = 0;
			const length = dataArray.length;
			for (let i = 0; i < length; i++) {
				sum += dataArray[i];
			}
			audioLevel = sum / length / 255; // Normalize to 0-1

			// Log audio level for debugging only when needed
			if (audioLevel > 0.05 && debugInfo.showDebug) {
				console.log('Audio level:', audioLevel.toFixed(2));
			}

			animationFrameId = requestAnimationFrame(updateAudioLevel);
		}

		updateAudioLevel();
	}

	async function activateInterface() {
		interfaceActive = true;
		buttonState = 'active';

		// Start recording immediately for the first question
		if (messages.length === 0) {
			startRecording();
		}
	}

	async function startRecording() {
		try {
			// Clean up any existing audio resources
			if (audioStream) {
				audioStream.getTracks().forEach((track) => track.stop());
			}

			if (audioContext) {
				if (audioContext.state !== 'closed') {
					await audioContext.close();
				}
				audioContext = null;
			}

			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}

			console.log('Starting recording...');
			audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(audioStream);
			audioChunks = [];

			// Set up audio analyzer
			audioContext = new AudioContext();
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;

			const source = audioContext.createMediaStreamSource(audioStream);
			source.connect(analyser);

			analyzeAudio();

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					console.log('Data available from recorder', event.data.size);
					audioChunks.push(event.data);
				}
			};

			// Start recording with timeslice to get data periodically
			mediaRecorder.start(1000);
			isRecording = true;
			waitingForQuestion = false;
			buttonState = 'recording';
			showTickIcon = false; // Reset tick icon state

			console.log('Recording started');
		} catch (error) {
			console.error('Error accessing microphone:', error);
			alert('Could not access microphone. Please check permissions or try typing your response.');
			mode = 'text';
		}
	}

	function stopRecording() {
		if (!mediaRecorder || !isRecording) return;

		console.log('Stopping recording...');

		try {
			mediaRecorder.stop();
		} catch (error) {
			console.error('Error stopping media recorder:', error);
		}

		isRecording = false;

		if (audioStream) {
			audioStream.getTracks().forEach((track) => track.stop());
			audioStream = null;
		}

		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}

		// Don't close audioContext here as it might be needed for playback
		// Just disconnect any sources if needed

		mediaRecorder = null;
		console.log('Recording stopped');
	}

	async function submitRecording() {
		if (!isRecording || audioChunks.length === 0) {
			console.log('Nothing to submit: isRecording=', isRecording, 'chunks=', audioChunks.length);
			return;
		}

		console.log('Submitting recording with', audioChunks.length, 'chunks');
		const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
		console.log('Audio blob size:', audioBlob.size);
		stopRecording();
		audioChunks = [];
		waitingForQuestion = true;
		buttonState = 'waiting';

		await processResponse(audioBlob);
	}

	async function processResponse(audioBlob?: Blob) {
		isProcessing = true;
		isThinking = true;

		try {
			let response: string;

			if (audioBlob) {
				console.log('Transcribing audio...');
				try {
					response = await transcribeAudio(audioBlob);
					// Save transcription for debugging
					debugInfo.lastTranscription = response;
					console.log('Whisper transcription:', response);
				} catch (transcriptionError) {
					console.error('Transcription error:', transcriptionError);
					throw new Error('Failed to transcribe your audio. Please try again or use text input.');
				}
			} else {
				response = textResponse;
				textResponse = '';
			}

			// Add user's response to messages
			messages = [...messages, { role: 'user', content: response }];

			// Get AI response
			console.log('Getting AI recommendation...');
			try {
				const aiResponse = await getSessionRecommendation(messages);
				console.log('AI response:', aiResponse);
				isThinking = false;

				// Try to parse as JSON to check if it's the final configuration
				try {
					// More efficient regex for JSON detection
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
							throw new Error('Invalid JSON format');
						}

						if (config && config.length && config.posture && config.eyes) {
							// Extract only the text part before the JSON if it exists
							const textPart = aiResponse.split(/```json|{/)[0].trim();

							// Add the AI's final message (without JSON) to the conversation
							if (textPart) {
								messages = [...messages, { role: 'assistant', content: textPart }];
								finalMessage = textPart;
								showFinalMessage = true;

								// Wait a moment to show the final message before closing
								setTimeout(() => {
									dispatch('config', {
										...config,
										conversation: messages
									});
								}, 5000);
							} else {
								dispatch('config', {
									...config,
									conversation: messages
								});
							}
							return;
						}
					}

					// If we get here, it's not a final response with valid JSON
					questionKey++; // Increment key to trigger transition
					currentQuestion = aiResponse;
					messages = [...messages, { role: 'assistant', content: aiResponse }];
					buttonState = 'active';

					// If in conversation mode and interface is active, start recording for the next question
					if (mode === 'conversation' && interfaceActive) {
						await tick();
						startRecording();
					}
				} catch (error) {
					console.error('Error processing AI response:', error);
					// Not JSON or error parsing, so it's a follow-up question
					questionKey++; // Increment key to trigger transition
					currentQuestion = aiResponse;
					messages = [...messages, { role: 'assistant', content: aiResponse }];
					buttonState = 'active';

					// If in conversation mode and interface is active, start recording for the next question
					if (mode === 'conversation' && interfaceActive) {
						await tick();
						startRecording();
					}
				}
			} catch (aiError) {
				console.error('AI recommendation error:', aiError);
				throw new Error('Failed to get a response. Please try again.');
			}
		} catch (error) {
			console.error('Error processing response:', error);
			alert(error instanceof Error ? error.message : 'An error occurred. Please try again.');
			buttonState = 'active';
		} finally {
			isProcessing = false;
		}
	}

	function handleSubmitText() {
		if (textResponse.trim()) {
			processResponse();
		}
	}

	function handleSkip() {
		stopRecording();
		dispatch('skip');
	}
</script>

<div class="pre-session-dialog">
	<div class="pre-session-header">
		<!-- Mode toggle -->
		<div class="mode-toggle">
			<button
				class:active={mode === 'conversation'}
				on:click={() => mode === 'text' && toggleMode()}
			>
				<i class="fas fa-microphone"></i> Voice
			</button>
			<button
				class:active={mode === 'text'}
				on:click={() => mode === 'conversation' && toggleMode()}
			>
				<i class="fas fa-keyboard"></i> Text
			</button>
		</div>
	</div>

	{#if showFinalMessage}
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
	{:else}
		<!-- Question display with improved typography and transitions -->
		<div class="question-container">
			<div class="question-wrapper">
				{#if isThinking}
					<div
						class="thinking-indicator"
						in:receive={{ key: 'thinking' }}
						out:send={{ key: 'thinking' }}
					>
						<i class="fas fa-circle-notch fa-spin"></i>
						<span>Thinking...</span>
					</div>
				{:else}
					<div
						class="question-content"
						in:receive={{ key: `question-${questionKey}` }}
						out:send={{ key: `question-${questionKey - 1}` }}
					>
						<p class="question">{currentQuestion}</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Input interface container with fixed height and absolute positioning for transitions -->
		<div class="input-interface-container">
			<div class="interface-wrapper">
				{#if mode === 'conversation'}
					<!-- Voice conversation interface with improved recording button -->
					<div
						class="conversation-interface"
						in:receive={{ key: 'conversation-mode' }}
						out:send={{ key: 'conversation-mode' }}
					>
						<div class="record-button-container">
							<button
								class="record-button"
								class:recording={isRecording}
								class:waiting={waitingForQuestion}
								style="transform: scale({isRecording ? 1 + audioLevel * 0.5 : 1})"
								on:click={!interfaceActive
									? activateInterface
									: isRecording
										? submitRecording
										: startRecording}
								on:mouseenter={() => isRecording && (showTickIcon = true)}
								on:mouseleave={() => isRecording && (showTickIcon = false)}
								disabled={isProcessing && !isRecording}
							>
								<div class="button-content">
									<!-- Only apply transitions when the button state changes -->
									{#if buttonState === 'initial'}
										<!-- Initial state - no transitions -->
										<div class="icon-container">
											<i class="fas fa-microphone"></i>
										</div>
									{:else if buttonState === 'recording'}
										<!-- Recording state -->
										<div
											class="icon-container"
											in:receiveIcon={{ key: 'recording' }}
											out:sendIcon={{ key: 'active' }}
										>
											<i
												class="fas fa-microphone"
												style="opacity: {showTickIcon ? 0 : 1}; transition: opacity 150ms ease;"
											></i>
											<i
												class="fas fa-check"
												style="opacity: {showTickIcon ? 1 : 0}; transition: opacity 150ms ease;"
											></i>
										</div>
									{:else if buttonState === 'waiting'}
										<!-- Waiting state -->
										<div
											class="loading-dots"
											in:receiveIcon={{ key: 'waiting' }}
											out:sendIcon={{ key: 'recording' }}
										>
											<span></span>
											<span></span>
											<span></span>
										</div>
									{:else}
										<!-- Active state (not recording or waiting) -->
										<div
											class="icon-container"
											in:receiveIcon={{ key: 'active' }}
											out:sendIcon={{ key: 'waiting' }}
										>
											<i class="fas fa-microphone"></i>
										</div>
									{/if}
								</div>
							</button>
						</div>
					</div>
				{/if}

				{#if mode === 'text'}
					<!-- Text input interface -->
					<div
						class="text-interface"
						in:receive={{ key: 'text-mode' }}
						out:send={{ key: 'text-mode' }}
					>
						<div class="text-input">
							<textarea
								bind:value={textResponse}
								placeholder="Type your response here..."
								disabled={isProcessing}
							></textarea>
							<button
								class="submit-btn"
								on:click={handleSubmitText}
								disabled={!textResponse.trim() || isProcessing}
							>
								<i class="fas fa-paper-plane"></i>
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<div class="pre-session-footer">
		<button class="skip-btn" on:click={handleSkip} disabled={isProcessing}>
			<i class="fas fa-arrow-right"></i>
			Skip to manual configuration
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
				<pre>isRecording: {isRecording}, chunks: {audioChunks.length}, waitingForQuestion: {waitingForQuestion}, buttonState: {buttonState}</pre>
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
</div>

<style>
	.pre-session-dialog {
		margin: 0 auto;
		padding: 1.5rem;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border-radius: 16px;
		backdrop-filter: blur(5px);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		box-shadow: 0 8px 20px var(--ui-shadow);
		position: relative;
	}

	.pre-session-header {
		margin-bottom: 1rem;
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
		max-width: 400px;
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

	/* Question container with improved typography */
	.question-container {
		min-height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.question-wrapper {
		width: 100%;
		max-width: 600px;
		min-height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.question-content {
		width: 100%;
		position: absolute;
		display: flex;
		justify-content: center;
	}

	.thinking-indicator {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--text-secondary);
		font-size: 1rem;
		position: absolute;
		padding: 1rem;
		background: rgba(var(--interactive-gradient-1), 0.05);
		border-radius: 12px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.thinking-indicator i {
		color: rgba(var(--interactive-gradient-1), 0.7);
	}

	.question {
		color: var(--text-primary);
		font-size: 1.2rem;
		line-height: 1.6;
		margin: 0;
		font-weight: 500;
		text-align: center;
		letter-spacing: 0.01em;
		font-family: 'Inter', sans-serif;
		padding: 1.5rem;
		background: rgba(var(--interactive-gradient-1), 0.05);
		border-radius: 12px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		width: 100%;
	}

	/* Input interface container to maintain consistent height */
	.input-interface-container {
		position: relative;
		height: 150px;
		margin-bottom: 2rem;
	}

	.interface-wrapper {
		position: relative;
		height: 100%;
		width: 100%;
	}

	/* Recording interface */
	.conversation-interface {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.record-button-container {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.record-button {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		border: none;
		background: var(--btn-bg);
		color: var(--btn-text);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
		padding: 0;
	}

	.record-button::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 50%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transform: skewX(-25deg);
		transition: all 0.75s ease;
	}

	.record-button:hover:not(:disabled)::after {
		left: 100%;
	}

	.record-button.recording {
		background: var(--ui-danger);
		box-shadow: 0 4px 12px rgba(var(--ui-danger), 0.3);
	}

	.record-button.waiting {
		background: var(--btn-bg);
	}

	.button-content {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
	}

	.icon-container {
		position: absolute;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		top: 0;
		left: 0;
	}

	.icon-container i {
		font-size: 1.2rem;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	/* Loading dots animation */
	.loading-dots {
		position: absolute;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		top: 0;
		left: 0;
	}

	.loading-dots span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: var(--btn-text);
		display: inline-block;
	}

	.loading-dots span:nth-child(1) {
		animation: bounce 1.4s ease-in-out infinite;
	}

	.loading-dots span:nth-child(2) {
		animation: bounce 1.4s ease-in-out 0.2s infinite;
	}

	.loading-dots span:nth-child(3) {
		animation: bounce 1.4s ease-in-out 0.4s infinite;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	/* Text interface */
	.text-interface {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.text-input {
		display: flex;
		gap: 0.75rem;
		width: 100%;
	}

	textarea {
		flex: 1;
		padding: 0.75rem;
		border-radius: 12px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		background: rgba(var(--background-card-rgb), 0.1);
		color: var(--text-primary);
		resize: vertical;
		min-height: 120px;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		transition: all 0.3s ease;
	}

	textarea:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 10px var(--ui-shadowHover);
	}

	textarea:focus {
		outline: none;
		border-color: rgba(var(--interactive-gradient-1), 0.4);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.2);
	}

	.submit-btn {
		padding: 0 1rem;
		border-radius: 12px;
		border: none;
		background: var(--btn-bg);
		color: var(--btn-text);
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
	}

	.submit-btn:hover:not(:disabled) {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(var(--interactive-gradient-1), 0.25);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.submit-btn i {
		font-size: 1.2rem;
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

	.pre-session-footer {
		margin-top: 1.5rem;
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
		margin-top: 1.5rem;
		padding: 1.5rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border-radius: 12px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		color: var(--text-primary);
		font-size: 0.85rem;
		font-family: 'Inter', sans-serif;
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

	/* Mobile optimizations */
	@media (max-width: 600px) {
		.pre-session-dialog {
			padding: 1rem;
			margin-bottom: 1rem;
		}

		.pre-session-header h2 {
			font-size: 1.5rem;
		}

		.question {
			font-size: 1rem;
			padding: 1rem;
		}

		.input-interface-container {
			height: 130px;
		}

		.final-message p {
			font-size: 0.95rem;
		}

		.skip-btn {
			font-size: 0.8rem;
			padding: 0.5rem 1rem;
		}

		textarea {
			min-height: 100px;
		}
	}
</style>
