<script lang="ts">
	import { onMount, createEventDispatcher, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { crossfade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

	const dispatch = createEventDispatcher<{
		submit: Blob | string;
		focus: void;
		blur: void;
	}>();

	export let inputMode: 'conversation' | 'text' = 'conversation';
	export let isRecording = false;
	export let isProcessing = false;
	export let isThinking = false;
	export let waitingForQuestion = false;
	export let maxCharCount = 500;
	export let currentQuestion: string;
	export let questionKey: number;

	// Watch for changes in isProcessing
	$: if (!isProcessing && buttonState === 'waiting' && inputMode === 'conversation') {
		// Small delay to ensure UI updates are complete
		setTimeout(() => {
			buttonState = 'active';
			startRecording();
		}, 100);
	}

	let audioLevel = 0;
	let textResponse = '';
	let charCount = 0;
	let interfaceActive = false;
	let audioChunks: Blob[] = [];
	let buttonState = 'initial'; // Track button state for animations: 'initial', 'recording', 'waiting'
	let showTickIcon = false; // Track if we should show the tick icon on hover

	// Audio recording
	let mediaRecorder: MediaRecorder | null = null;
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let audioStream: MediaStream | null = null;
	let animationFrameId: number | null = null;
	let recordingStartTime: number | null = null;
	let recordingTimer: ReturnType<typeof setTimeout> | null = null;
	let maxRecordingTime = 120000; // 2 minutes in milliseconds

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

	// Toggle between conversation and text modes
	export function toggleMode() {
		if (inputMode === 'conversation') {
			stopRecording();
			inputMode = 'text';
		} else {
			inputMode = 'conversation';
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

			// Clear recording timer
			if (recordingTimer !== null) {
				clearTimeout(recordingTimer);
				recordingTimer = null;
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

			animationFrameId = requestAnimationFrame(updateAudioLevel);
		}

		updateAudioLevel();
	}

	async function activateInterface() {
		interfaceActive = true;
		buttonState = 'active';
		startRecording(); // Always start recording when interface is activated
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

			// Clear any existing recording timer
			if (recordingTimer !== null) {
				clearTimeout(recordingTimer);
				recordingTimer = null;
			}

			// Set recording start time and max recording timer
			recordingStartTime = Date.now();
			recordingTimer = setTimeout(() => {
				console.log('Maximum recording time reached (2 minutes), stopping recording');
				submitRecording();
			}, maxRecordingTime);

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
			dispatch('submit', 'ERROR_ACCESSING_MICROPHONE');
			inputMode = 'text';
		}
	}

	export function stopRecording() {
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

		// Clear recording timer
		if (recordingTimer !== null) {
			clearTimeout(recordingTimer);
			recordingTimer = null;
		}
		recordingStartTime = null;

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

		dispatch('submit', audioBlob);
	}

	// Calculate character count for text input and enforce limit
	function updateCharCount() {
		// Enforce character limit directly when typing
		if (textResponse.length > maxCharCount) {
			textResponse = textResponse.substring(0, maxCharCount);
		}
		charCount = textResponse.length;
	}

	function handleFocus() {
		dispatch('focus');
	}

	function handleBlur() {
		dispatch('blur');
	}

	function handleTextareaFocus() {
		handleFocus();
	}

	function handleTextareaBlur() {
		handleBlur();
	}

	function handleSubmitText() {
		if (textResponse.trim()) {
			// Double-check character limit before submitting
			if (charCount > maxCharCount) {
				textResponse = textResponse.substring(0, maxCharCount);
				updateCharCount();
			}

			const response = textResponse;
			textResponse = '';
			charCount = 0;
			dispatch('submit', response);
		}
	}
</script>

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
		{#if inputMode === 'conversation'}
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
						style="transform: scale({isRecording ? 1 + audioLevel * 1 : 1})"
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

		{#if inputMode === 'text'}
			<!-- Text input interface -->
			<div class="text-interface" in:receive={{ key: 'text-mode' }} out:send={{ key: 'text-mode' }}>
				<div class="text-input">
					<div class="textarea-container">
						<textarea
							bind:value={textResponse}
							on:input={updateCharCount}
							on:focus={handleTextareaFocus}
							on:blur={handleTextareaBlur}
							placeholder="Type your response here..."
							disabled={isProcessing}
						></textarea>
						<div class="char-count" class:warning={charCount > maxCharCount}>
							{charCount}/{maxCharCount} characters
						</div>
					</div>
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

<style>
	/* Question container with improved typography */
	.question-container {
		min-height: 150px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.question-wrapper {
		width: 100%;
		max-width: 600px;
		min-height: 150px;
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
	}

	.question {
		color: var(--text-primary);
		font-size: 1.1rem;
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
		max-height: 100px;
		overflow-y: auto;
	}

	/* Input interface container to maintain consistent height */
	.input-interface-container {
		position: relative;
		height: 150px;
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
		align-items: stretch; /* Stretch items to fill container height */
	}

	.textarea-container {
		position: relative;
		flex: 1;
		height: 120px; /* Fixed height */
	}

	textarea {
		width: 100%;
		height: 100%; /* Fill container height */
		padding: 0.75rem;
		border-radius: 12px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		background: rgba(var(--background-card-rgb), 0.1);
		color: var(--text-primary);
		resize: none; /* Disable resizing */
		overflow-y: auto; /* Add scrollbar when needed */
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		transition: all 0.3s ease;
		padding-bottom: 2.5rem; /* Make room for char count */
		box-sizing: border-box; /* Ensure padding is included in width/height */
	}

	.char-count {
		position: absolute;
		bottom: 0.5rem;
		left: 0.75rem;
		font-size: 0.8rem;
		color: var(--text-secondary);
		background: rgba(var(--background-card-rgb), 0.7);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		transition: all 0.3s ease;
		z-index: 1;
	}

	.char-count.warning {
		color: var(--ui-danger);
		font-weight: 500;
	}

	.submit-btn {
		height: 120px; /* Match textarea container height exactly */
		padding: 0 1rem;
		border-radius: 12px;
		border: none;
		background: var(--btn-bg);
		color: var(--btn-text);
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box; /* Ensure padding is included in height */
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

	/* Mobile optimizations */
	@media (max-width: 600px) {
		.question {
			font-size: 1rem;
			padding: 1rem;
		}
	}
</style>
