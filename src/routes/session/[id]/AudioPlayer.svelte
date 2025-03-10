<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { setupAudioVisualizer } from '$lib/audioVisualizer';
	import { formatTime } from './Utils';
	import { browser } from '$app/environment';
	import {
		saveAudioProgress,
		getAudioProgress,
		clearAudioProgress,
		cleanupExpiredProgress,
		forceSaveAudioProgress
	} from '$lib/audioProgress';

	export let audioUrl: string;
	export let meditationId: string;
	export let duration: number;
	export let userId: string;
	export let isFeedbackVisible: boolean;
	export let sendCompletionRequest: () => void;

	let audioElement: HTMLAudioElement;
	let canvasElement: HTMLCanvasElement;
	let canvasContext: CanvasRenderingContext2D | null;
	let canvasWidth = 300;
	let canvasHeight = 300;
	let audioContext: AudioContext;

	let isPlaying = false;
	let currentTime = 0;
	let volume = 1;
	let isMuted = false;
	let previousVolume = 1;

	let isSeekingProgress = false;
	let hassentCompletionRequest = false;
	let lockSend = false;
	let totalPlayTime = 0;
	let lastUpdateTime = 0;

	let visualizer: ReturnType<typeof setupAudioVisualizer> | null = null;

	let canvasOpacity = 0;
	let canvasBlur = 3; // Initial blur amount in pixels

	let audioContextInitialized = false;
	let audioSourceConnected = false;
	let retryCount = 0;
	const MAX_RETRIES = 3;

	let isSafari = false;
	let audioLoaded = false;
	let playAttemptPending = false;

	// Add iOS detection
	let isIOS = false;

	function detectIOS() {
		const userAgent = window.navigator.userAgent.toLowerCase();
		isIOS = /iphone|ipad|ipod|macintosh/.test(userAgent) && 'ontouchend' in document;
		console.log('[AudioPlayer] iOS device detected:', isIOS);
		return isIOS;
	}

	// Special function for iOS audio unlock
	function setupIOSAudioUnlock() {
		if (!isIOS) return;

		console.log('[AudioPlayer] Setting up iOS audio unlock');

		// Function to unlock audio on iOS
		const unlockAudio = () => {
			console.log('[AudioPlayer] iOS unlock function triggered');

			// Create and play a silent audio element
			const silentAudio = document.createElement('audio');
			silentAudio.setAttribute(
				'src',
				'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV'
			);
			silentAudio.setAttribute('playsinline', 'true');
			silentAudio.setAttribute('preload', 'auto');
			silentAudio
				.play()
				.then(() => {
					console.log('[AudioPlayer] Silent audio played successfully for iOS unlock');

					// Initialize AudioContext if needed
					if (!audioContextInitialized) {
						initializeAudioContext();
					}

					// Resume AudioContext
					if (audioContext) {
						audioContext.resume().then(() => {
							console.log('[AudioPlayer] AudioContext resumed during iOS unlock');
						});
					}

					// Remove the event listeners once unlocked
					document.removeEventListener('touchstart', unlockAudio);
					document.removeEventListener('touchend', unlockAudio);
					document.removeEventListener('click', unlockAudio);
				})
				.catch((error) => {
					console.error('[AudioPlayer] Silent audio play failed:', error);
				});
		};

		// Add event listeners for user interactions
		document.addEventListener('touchstart', unlockAudio, false);
		document.addEventListener('touchend', unlockAudio, false);
		document.addEventListener('click', unlockAudio, false);
	}

	function initializeAudioContext() {
		if (audioContextInitialized) {
			console.log('[AudioPlayer] AudioContext already initialized');
			return;
		}

		console.log('[AudioPlayer] Initializing AudioContext on user interaction');
		try {
			audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			console.log('[AudioPlayer] AudioContext created, state:', audioContext.state);
			audioContextInitialized = true;
		} catch (error) {
			console.error('[AudioPlayer] Error creating AudioContext:', error);
		}
	}

	function connectAudioSource() {
		if (audioSourceConnected || !audioContext || !audioElement) {
			return;
		}

		try {
			console.log('[AudioPlayer] Connecting audio source to context');
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 1024;

			const source = audioContext.createMediaElementSource(audioElement);
			source.connect(analyser);
			analyser.connect(audioContext.destination);

			visualizer = setupAudioVisualizer(
				audioElement,
				canvasElement,
				analyser,
				canvasWidth,
				canvasHeight
			);

			if (visualizer) {
				visualizer.setStandbyMode(true);
			}

			audioSourceConnected = true;
			console.log('[AudioPlayer] Audio source connected successfully');
		} catch (error) {
			console.error('[AudioPlayer] Error connecting audio source:', error);
		}
	}

	function updatePlayingState() {
		isPlaying = !audioElement.paused;
		console.log('[AudioPlayer] Playing state updated:', isPlaying);
	}

	function setupCanvas() {
		if (canvasElement && window) {
			console.log('[AudioPlayer] Setting up canvas');
			const dpr = window.devicePixelRatio || 1;
			const rect = canvasElement.getBoundingClientRect();
			canvasWidth = rect.width;
			canvasHeight = rect.height;
			canvasElement.width = canvasWidth * dpr;
			canvasElement.height = canvasHeight * dpr;
			canvasContext = canvasElement.getContext('2d');
			if (canvasContext) {
				canvasContext.scale(dpr, dpr);
			}
		}
	}

	function detectSafari() {
		const userAgent = window.navigator.userAgent.toLowerCase();
		isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
		console.log('[AudioPlayer] Safari browser detected:', isSafari);
		return isSafari;
	}

	export function togglePlayPause() {
		console.log('[AudioPlayer] togglePlayPause called, current paused state:', audioElement.paused);
		console.log('[AudioPlayer] Audio readyState:', audioElement.readyState);
		console.log('[AudioPlayer] Audio networkState:', audioElement.networkState);

		if (audioElement.paused) {
			// Initialize AudioContext if needed
			if (!audioContextInitialized) {
				initializeAudioContext();
			}

			// Connect audio source if needed (only after audio is somewhat loaded)
			if (!audioSourceConnected && audioElement.readyState >= 1) {
				connectAudioSource();
			}

			// Check if audio is ready
			if (audioElement.readyState < 2) {
				console.log('[AudioPlayer] Audio not ready yet, setting pending play attempt');
				playAttemptPending = true;
				if (audioElement.networkState !== 2) {
					// If not already loading
					console.log('[AudioPlayer] Triggering audio load');
					audioElement.load();
				}
				return;
			}

			try {
				if (audioContext) {
					console.log('[AudioPlayer] Resuming AudioContext, current state:', audioContext.state);
					audioContext.resume().then(() => {
						console.log('[AudioPlayer] AudioContext resumed, attempting playback');
						audioElement
							.play()
							.then(() => {
								console.log('[AudioPlayer] Playback started successfully');
								isPlaying = true;
								lastUpdateTime = Date.now();
								visualizer?.setStandbyMode(false);
							})
							.catch((error) => {
								console.error('[AudioPlayer] Initial playback failed:', error);
								// One retry with a delay
								setTimeout(() => {
									console.log('[AudioPlayer] Retrying playback');
									audioElement
										.play()
										.then(() => {
											console.log('[AudioPlayer] Retry playback successful');
											isPlaying = true;
											lastUpdateTime = Date.now();
											visualizer?.setStandbyMode(false);
										})
										.catch((retryError) => {
											console.error('[AudioPlayer] Retry failed:', retryError);
											isPlaying = false;
										});
								}, 100);
							});
					});
				} else {
					audioElement
						.play()
						.then(() => {
							console.log('[AudioPlayer] Direct playback successful');
							isPlaying = true;
							lastUpdateTime = Date.now();
						})
						.catch((error) => {
							console.error('[AudioPlayer] Direct playback failed:', error);
							isPlaying = false;
						});
				}
			} catch (error) {
				console.error('[AudioPlayer] Error in play attempt:', error);
				isPlaying = false;
			}
		} else {
			console.log('[AudioPlayer] Pausing audio');
			audioElement.pause();
			isPlaying = false;
			updateProgress();
			visualizer?.setStandbyMode(true);
		}
	}

	function startPlayback() {
		console.log('[AudioPlayer] startPlayback called');

		// Initialize AudioContext if needed
		if (!audioContextInitialized) {
			console.log('[AudioPlayer] First playback, initializing AudioContext');
			initializeAudioContext();
		}

		// Use the same pattern as togglePlayPause for consistency
		if (audioContext && audioContext.state === 'suspended') {
			console.log('[AudioPlayer] AudioContext is suspended, attempting to resume...');
			audioContext
				.resume()
				.then(() => {
					console.log('[AudioPlayer] AudioContext resumed successfully from startPlayback');
					return playAudio();
				})
				.catch((error) => {
					console.error('[AudioPlayer] Error resuming audio context from startPlayback:', error);
				});
		} else {
			console.log(
				'[AudioPlayer] AudioContext is already running or not needed, playing audio directly from startPlayback'
			);
			playAudio();
		}
	}

	function updateProgress() {
		const now = Date.now();
		if (isPlaying) {
			totalPlayTime += (now - lastUpdateTime) / 1000;
		}
		lastUpdateTime = now;

		currentTime = audioElement.currentTime;

		// Save progress to localStorage (debounced)
		if (browser) {
			saveAudioProgress(meditationId, currentTime, duration);
		}

		const minimumPlayTimeRequired = duration * 0.8;
		const timeUntilEnd = duration - currentTime;

		if (
			!lockSend &&
			!hassentCompletionRequest &&
			totalPlayTime >= minimumPlayTimeRequired &&
			timeUntilEnd <= 60
		) {
			lockSend = true;
			sendCompletionRequest();
			hassentCompletionRequest = true;
		}
	}

	function handlePause() {
		console.log('[AudioPlayer] handlePause called');
		updatePlayingState();
		// Force save progress when user explicitly pauses
		if (browser) {
			forceSaveAudioProgress(meditationId, audioElement.currentTime, duration);
		}
	}

	function startSeek(event: MouseEvent | TouchEvent) {
		isSeekingProgress = true;
		seek(event);
	}

	function seeking(event: MouseEvent | TouchEvent) {
		if (isSeekingProgress) {
			seek(event);
		}
	}

	function endSeek() {
		isSeekingProgress = false;
	}

	function seek(event: MouseEvent | TouchEvent) {
		const progressBar = event.currentTarget as HTMLDivElement;
		const rect = progressBar.getBoundingClientRect();
		let clientX: number;

		if (event instanceof MouseEvent) {
			clientX = event.clientX;
		} else {
			clientX = event.touches[0].clientX;
		}

		const clickPosition = (clientX - rect.left) / rect.width;
		audioElement.currentTime = clickPosition * audioElement.duration;
		updateProgress();
	}

	function setVolume(event: Event) {
		const volumeInput = event.target as HTMLInputElement;
		const newVolume = parseFloat(volumeInput.value);

		if (newVolume > 0) {
			volume = newVolume;
			audioElement.volume = volume;
			isMuted = false;
			audioElement.muted = false;
			previousVolume = volume;
		} else {
			volume = 0;
			audioElement.volume = 0;
			isMuted = true;
			audioElement.muted = true;
		}

		// Update the CSS variable at the root level
		if (browser) {
			document.documentElement.style.setProperty('--volume-percentage', `${volume * 100}%`);
		}
	}

	export function toggleMute() {
		// Initialize AudioContext if needed (for iOS)
		if (!audioContextInitialized && isPlaying) {
			initializeAudioContext();
		}

		isMuted = !isMuted;
		audioElement.muted = isMuted;
		if (isMuted) {
			previousVolume = volume > 0 ? volume : previousVolume;
			volume = 0;
			audioElement.volume = 0;
		} else {
			volume = previousVolume > 0 ? previousVolume : 0.5;
			audioElement.volume = volume;
		}

		// Update the CSS variable at the root level
		if (browser) {
			document.documentElement.style.setProperty('--volume-percentage', `${volume * 100}%`);
		}
	}

	export function adjustVolume(delta: number) {
		// Initialize AudioContext if needed (for iOS)
		if (!audioContextInitialized && isPlaying) {
			initializeAudioContext();
		}

		volume = Math.max(0, Math.min(1, volume + delta));
		audioElement.volume = volume;
		if (volume > 0) {
			isMuted = false;
			audioElement.muted = false;
			previousVolume = volume;
		} else {
			isMuted = true;
			audioElement.muted = true;
		}

		// Update the CSS variable at the root level
		if (browser) {
			document.documentElement.style.setProperty('--volume-percentage', `${volume * 100}%`);
		}
	}

	export function seekBackward(seconds: number) {
		// Initialize AudioContext if needed (for iOS)
		if (!audioContextInitialized && isPlaying) {
			initializeAudioContext();
		}

		audioElement.currentTime = Math.max(audioElement.currentTime - seconds, 0);
		updateProgress();
	}

	export function seekForward(seconds: number) {
		// Initialize AudioContext if needed (for iOS)
		if (!audioContextInitialized && isPlaying) {
			initializeAudioContext();
		}

		audioElement.currentTime = Math.min(audioElement.currentTime + seconds, audioElement.duration);
		updateProgress();
	}

	function handleAudioEnded() {
		if (visualizer) {
			visualizer.startCelebration();
		}
	}

	function fadeInCanvas() {
		const startTime = Date.now();
		const fadeInDuration = 200;

		function updateCanvasStyle() {
			const currentTime = Date.now();
			const progress = Math.min((currentTime - startTime) / fadeInDuration, 1);
			canvasOpacity = progress;
			canvasBlur = 5 * (1 - progress);

			if (progress < 1) {
				requestAnimationFrame(updateCanvasStyle);
			}
		}

		requestAnimationFrame(updateCanvasStyle);
	}

	function handleAudioLoaded() {
		console.log('[AudioPlayer] Audio loaded event');
		console.log('[AudioPlayer] Audio readyState:', audioElement?.readyState);
		console.log('[AudioPlayer] Audio networkState:', audioElement?.networkState);

		audioLoaded = true;
		retryCount = 0;

		if (playAttemptPending) {
			console.log('[AudioPlayer] Executing pending play attempt now that audio is loaded');
			playAttemptPending = false;
			setTimeout(() => {
				togglePlayPause();
			}, 50);
		}
	}

	function handleAudioStalled() {
		console.log('[AudioPlayer] Audio stalled');
		if (retryCount < MAX_RETRIES) {
			retryCount++;
			console.log(`[AudioPlayer] Retrying load (attempt ${retryCount}/${MAX_RETRIES})`);
			setTimeout(() => {
				console.log('[AudioPlayer] Reloading audio after stall');
				audioElement.load();
			}, 1000 * retryCount); // Exponential backoff
		}
	}

	onMount(() => {
		console.log('[AudioPlayer] Component mounted');
		detectSafari();

		if (audioElement && canvasElement) {
			console.log('[AudioPlayer] Audio and canvas elements found, initializing...');
			setupCanvas();

			// Start loading the audio
			console.log('[AudioPlayer] Starting audio load');
			audioElement.load();
		} else {
			console.error('[AudioPlayer] Audio or Canvas element is missing');
		}

		fadeInCanvas();

		if (browser) {
			document.documentElement.style.setProperty('--volume-percentage', `${volume * 100}%`);
		}

		// Add event listeners for user interactions that might initialize audio
		const canvasContainer = document.querySelector('.canvas-container');
		if (canvasContainer) {
			canvasContainer.addEventListener('click', () => {
				console.log('[AudioPlayer] Canvas container clicked - user interaction detected');
			});
		}

		return () => {
			if (audioElement) {
				audioElement.removeEventListener('play', updatePlayingState);
				audioElement.removeEventListener('pause', updatePlayingState);
				audioElement.removeEventListener('ended', handleAudioEnded);
			}
		};
	});

	onDestroy(() => {
		// Force save progress when component is destroyed
		if (browser && audioElement) {
			forceSaveAudioProgress(meditationId, audioElement.currentTime, duration);
		}
	});
</script>

{#if audioUrl}
	<div class="audio-player" class:hidden={isFeedbackVisible}>
		<div
			class="canvas-container"
			on:click={togglePlayPause}
			style="opacity: {canvasOpacity}; filter: blur({canvasBlur}px); transition: opacity 0.2s ease-in, filter 0.1s ease-in;"
		>
			<canvas bind:this={canvasElement} style="width: 300px; height: 300px;"></canvas>
			<button
				class="play-button"
				on:click|stopPropagation={togglePlayPause}
				aria-label={isPlaying ? 'Pause' : 'Play'}
			>
				<div class="play-overlay" class:visible={!isPlaying}>
					<svg viewBox="0 0 24 24" width="48" height="48">
						<polygon points="5,3 19,12 5,21" fill="#FFFFFF" />
					</svg>
				</div>
			</button>
		</div>
		<audio
			bind:this={audioElement}
			src={audioUrl}
			crossorigin="anonymous"
			preload="auto"
			on:loadedmetadata={() => {
				console.log('[AudioPlayer] Metadata loaded');
				updateProgress();
			}}
			on:loadeddata={() => {
				console.log('[AudioPlayer] Audio data loaded');
				handleAudioLoaded();
			}}
			on:canplay={() => {
				console.log('[AudioPlayer] Can play event');
				handleAudioLoaded();
			}}
			on:canplaythrough={() => {
				console.log('[AudioPlayer] Can play through event');
				handleAudioLoaded();
			}}
			on:play={updatePlayingState}
			on:pause={handlePause}
			on:ended={handleAudioEnded}
			on:error={(e) => {
				console.error('[AudioPlayer] Audio error:', e.target.error);
			}}
			on:stalled={handleAudioStalled}
			on:waiting={() => {
				console.log('[AudioPlayer] Audio waiting');
			}}
		></audio>
	</div>

	<div class="controls-wrapper">
		<div class="custom-audio-controls">
			<div
				class="progress-container"
				on:mousedown={startSeek}
				on:mousemove={seeking}
				on:mouseup={endSeek}
				on:mouseleave={endSeek}
				on:touchstart={startSeek}
				on:touchmove={seeking}
				on:touchend={endSeek}
				on:touchcancel={endSeek}
			>
				<div class="progress-bar" style="width: {(currentTime / duration) * 100}%"></div>
				<div
					class="progress-knob"
					style="left: calc({(currentTime / duration) * 100}% - 8px)"
				></div>
			</div>
			<div class="controls-row">
				<div class="time-display">
					{formatTime(currentTime)} / {formatTime(duration)}
				</div>
				<div class="volume-control">
					<i
						class={`fas fa-${
							isMuted || volume === 0
								? 'volume-xmark'
								: volume < 0.2
									? 'volume-off'
									: volume < 0.5
										? 'volume-low'
										: 'volume-high'
						}`}
						on:click={toggleMute}
					></i>
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						bind:value={volume}
						on:input={setVolume}
						class="volume-slider"
					/>
				</div>
			</div>
		</div>
	</div>
{:else}
	<p class="no-audio">
		Audio not available for this meditation. (Audio URL: {audioUrl})
	</p>
{/if}

<style>
	/* Styles related to the audio player and controls */

	.audio-player {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex-grow: 1;
		transition: opacity 0.5s ease-in-out;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
	}

	.audio-player.hidden {
		opacity: 0;
		pointer-events: none;
	}

	.canvas-container {
		position: relative;
		cursor: pointer;
		margin-bottom: 0;
		opacity: 0;
		filter: blur(1.25rem);
		transition:
			opacity 0.4s ease-in,
			filter 0.4s ease-in;
	}

	canvas {
		display: block;
		border-radius: 50%;
		transition: filter 0.3s ease;
	}

	:global(.dark-theme) canvas,
	:global(.cosmic-theme) canvas {
		opacity: 0.85;
	}

	.play-button {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: transparent;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0;
		margin: 0;
	}

	.play-overlay {
		filter: drop-shadow(0px 0.125rem 0.25rem rgba(0, 0, 0, 0.25));
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		opacity: 0;
		transition: opacity 0.6s ease;
		pointer-events: none;
	}

	.play-overlay.visible {
		opacity: 1;
	}

	.controls-wrapper {
		width: 100%;
		max-width: 400px;
		position: fixed;
		bottom: 4rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		z-index: 1;
	}

	/* Native app specific positioning */
	:global(.native-app) .controls-wrapper {
		bottom: 6rem; /* More space at bottom for native app navigation */
	}

	.custom-audio-controls {
		width: 100%;
	}

	.progress-container {
		width: 100%;
		height: 0.275rem;
		background-color: #d0d0d0;
		border-radius: 1px;
		cursor: pointer;
		position: relative;
		margin-bottom: 0.5rem;
	}

	.progress-bar {
		height: 100%;
		background-color: #97aacf;
		border-radius: 1px;
		position: absolute;
		top: 0;
		left: 0;
	}

	.progress-knob {
		width: 0.75rem;
		height: 0.75rem;
		background-color: #97aacf;
		border-radius: 50%;
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		box-shadow: 0 0rem 10px rgba(0, 0, 0, 0.7);
		transition: transform 0.1s ease;
		cursor: pointer;
	}

	.progress-knob:hover {
		transform: translateY(-50%) scale(1.2);
	}

	.controls-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.time-display {
		font-size: 0.8rem;
		color: #e1e1e1a0;
	}

	/* Volume Control */
	.volume-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.volume-control i {
		width: 1rem;
		text-align: center;
		font-size: 1rem;
		color: #d0d0d0;
	}

	.volume-slider {
		width: 5rem;
		-webkit-appearance: none;
		background: transparent;
		cursor: pointer;
	}

	/* Global styles for pseudo-elements */
	:global(.volume-slider::-webkit-slider-thumb) {
		-webkit-appearance: none;
		height: 0.75rem;
		width: 0.75rem;
		border-radius: 50%;
		background: #97aacf;
		cursor: pointer;
		margin-top: -0.25rem;
		box-shadow: 0 0rem 10px rgba(0, 0, 0, 0.7);
	}

	:global(.volume-slider::-moz-range-thumb) {
		height: 0.75rem;
		width: 0.75rem;
		border: none;
		border-radius: 50%;
		background: #97aacf;
		box-shadow: 0 0rem 10px rgba(0, 0, 0, 0.7);
		cursor: pointer;
	}

	:global(.volume-slider::-webkit-slider-runnable-track) {
		-webkit-appearance: none;
		width: 100%;
		height: 0.25rem;
		background: linear-gradient(
			to right,
			#97aacf var(--volume-percentage, 50%),
			#d0d0d0 var(--volume-percentage, 50%)
		);
		border-radius: 1px;
	}

	:global(.volume-slider::-moz-range-track) {
		width: 100%;
		height: 0.25rem;
		background: linear-gradient(
			to right,
			#97aacf var(--volume-percentage, 50%),
			#d0d0d0 var(--volume-percentage, 50%)
		);
		border-radius: 1px;
	}

	.no-audio {
		text-align: center;
		color: #666;
		font-style: italic;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.progress-knob {
			width: 0.8rem;
			height: 0.8rem;
		}

		.progress-knob:hover {
			transform: translateY(-50%) scale(1.1);
		}
	}

	@media (max-width: 600px) {
		.controls-wrapper {
			max-width: 85%;
		}

		.volume-control {
			display: none;
		}
	}

	/* Adjust for smaller screens */
	@media (max-height: 900px) {
		.audio-player {
			top: 55%;
		}
	}

	@media (max-height: 700px) {
		.audio-player {
			transform: translate(-50%, -50%) scale(0.9);
		}
		.controls-wrapper {
			bottom: 1rem;
		}
	}

	/* Adjust for very small screens */
	@media (max-height: 600px) {
		.audio-player {
			transform: translate(-50%, -50%) scale(0.8);
		}
	}
</style>
