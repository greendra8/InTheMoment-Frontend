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

	function updatePlayingState() {
		isPlaying = !audioElement.paused;
	}

	function setupCanvas() {
		if (canvasElement && window) {
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

	export function togglePlayPause() {
		if (!audioContext) {
			// If audioContext doesn't exist yet, create it first
			try {
				audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

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
					visualizer.setStandbyMode(!audioElement.paused);
				}
			} catch (error) {
				console.error('Error creating audio context on demand:', error);
			}
		}

		if (audioElement.paused) {
			// Use a promise chain to handle play() properly
			Promise.resolve()
				.then(() => {
					// First try to resume the audio context if it's suspended
					if (audioContext && audioContext.state === 'suspended') {
						return audioContext.resume();
					}
					return Promise.resolve();
				})
				.then(() => {
					// Then try to play the audio
					return audioElement.play();
				})
				.then(() => {
					isPlaying = true;
					lastUpdateTime = Date.now();
					visualizer?.setStandbyMode(false);
				})
				.catch((error) => {
					console.error('Error starting playback:', error);
					// If we get a NotAllowedError, show a message to the user
					if (error.name === 'NotAllowedError') {
						alert('Please interact with the page first to enable audio playback.');
					}
				});
		} else {
			audioElement.pause();
			isPlaying = false;
			updateProgress();
			visualizer?.setStandbyMode(true);
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
		audioElement.currentTime = Math.max(audioElement.currentTime - seconds, 0);
		updateProgress();
	}

	export function seekForward(seconds: number) {
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

	onMount(() => {
		// Define resumeAudioContext at the top level of onMount so it's accessible in the cleanup function
		const resumeAudioContext = () => {
			if (audioContext && audioContext.state === 'suspended') {
				audioContext.resume().catch((err) => console.error('Failed to resume AudioContext:', err));
			}
		};

		if (audioElement && canvasElement) {
			setupCanvas();
			try {
				// Create audio context only after user interaction
				const setupAudio = () => {
					try {
						if (!audioContext) {
							audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

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
						}
					} catch (error) {
						console.error('Error setting up audio context:', error);
					}
				};

				// Add event listeners for user interaction
				document.addEventListener('click', resumeAudioContext);
				document.addEventListener('touchstart', resumeAudioContext);

				// Setup audio on first user interaction
				const initialSetup = () => {
					setupAudio();
					document.removeEventListener('click', initialSetup);
					document.removeEventListener('touchstart', initialSetup);
				};

				document.addEventListener('click', initialSetup);
				document.addEventListener('touchstart', initialSetup);
			} catch (error) {
				console.error('Error initializing audio context:', error);
			}

			// Load saved progress
			if (browser) {
				cleanupExpiredProgress(); // Clean up any expired progress
				const savedProgress = getAudioProgress(meditationId);
				if (savedProgress !== null) {
					audioElement.currentTime = savedProgress;
				}
			}
		} else {
			console.error('Audio or Canvas element is missing');
		}

		fadeInCanvas();

		// Initialize CSS variable
		if (browser) {
			document.documentElement.style.setProperty('--volume-percentage', `${volume * 100}%`);
		}

		return () => {
			if (audioElement) {
				audioElement.removeEventListener('play', updatePlayingState);
				audioElement.removeEventListener('pause', updatePlayingState);
				audioElement.removeEventListener('ended', handleAudioEnded);
			}

			// Remove event listeners for resuming AudioContext
			document.removeEventListener('click', resumeAudioContext);
			document.removeEventListener('touchstart', resumeAudioContext);

			// Also remove initialSetup listeners if they're still there
			document.removeEventListener('click', initialSetup);
			document.removeEventListener('touchstart', initialSetup);

			// Close AudioContext if it exists
			if (audioContext) {
				try {
					audioContext.close().catch((err) => console.error('Error closing AudioContext:', err));
				} catch (error) {
					console.error('Error closing AudioContext:', error);
				}
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
			<div class="play-overlay" class:visible={!isPlaying}>
				<svg viewBox="0 0 24 24" width="48" height="48">
					<polygon points="5,3 19,12 5,21" fill="#FFFFFF" />
				</svg>
			</div>
		</div>
		<audio
			bind:this={audioElement}
			src={audioUrl}
			crossorigin="anonymous"
			playsinline
			on:timeupdate={updateProgress}
			on:loadedmetadata={updateProgress}
			on:play={updatePlayingState}
			on:pause={handlePause}
			on:ended={handleAudioEnded}
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
		top: 55%;
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
