<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { completeMeditation, submitFeedback } from '$lib/supabase';
  import { setupAudioVisualizer } from '$lib/audioVisualizer';
  import type { PageData } from './$types';
  import { browser } from '$app/environment';
  import FeedbackForm from '$lib/components/FeedbackForm.svelte';
  import bg from '$lib/assets/med-bg.png';
  import { writable } from 'svelte/store';
  import { fly, fade } from 'svelte/transition';

  export let data: PageData;
  const { meditation, userId, feedback } = data;

  const audioUrl = meditation.file_path;

  let audioElement: HTMLAudioElement;
  let canvasElement: HTMLCanvasElement;
  let canvasContext: CanvasRenderingContext2D | null;
  let canvasWidth = 300;
  let canvasHeight = 300;
  let audioContext: AudioContext;

  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
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

  let isDownloaded = false;

  let isCompletedThisSession = false;
  let showFeedbackForm = meditation.listened || !!feedback || isCompletedThisSession;
  let isFeedbackVisible = false; // Initialize to true if no feedback exists

  let isFeedbackFocused = false;

  $: windowHeight = browser ? window.innerHeight : 0;
  $: contentHeight = windowHeight; // Subtracting the global layout padding

  let localFeedback = writable(feedback?.text || '');

  // Store the real viewport height, accounting for mobile browser UI
  let realViewportHeight: number;

  // Function to calculate and set the real viewport height
  function setRealViewportHeight() {
    // Get the inner height of the window, which excludes browser UI
    realViewportHeight = window.innerHeight;
    // Set a CSS custom property with the real viewport height
    // This allows us to use it in our CSS for accurate sizing
    document.documentElement.style.setProperty('--real-viewport-height', `${realViewportHeight}px`);
  }

  function handleResize() {
    windowHeight = window.innerHeight;
    setupCanvas(); // Keep this as it might be useful for other purposes
    // Remove the call to visualizer.updateCanvasSize
  }

  async function handleFeedbackSubmit(event: CustomEvent) {
    const { sessionId, profileId, feedback } = event.detail;
    console.log('Handling feedback submission:', { sessionId, profileId, feedback });
    try {
      const result = await submitFeedback(sessionId, profileId, feedback);
      console.log('Feedback submitted successfully:', result);
      localFeedback.set(feedback); // Update local feedback after successful submission
    } catch (error) {
      console.error('Error submitting feedback:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Optionally, you could show an error message to the user here
    }
  }

  function updateDownloadUI(meditationId: string, downloadStatus: boolean) {
    if (meditationId === meditation.id) {
      isDownloaded = downloadStatus;
    }
  }

  function handleDownloadStatusUpdate(event: CustomEvent) {
    const { meditationId, isDownloaded: downloadStatus } = event.detail;
    updateDownloadUI(meditationId, downloadStatus);
  }

  function handleDownloadComplete(event: CustomEvent) {
    const { meditationId } = event.detail;
    updateDownloadUI(meditationId, true);
  }

  function checkDownloadStatus() {
    if (browser && (window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({
        type: 'checkDownloadStatus',
        payload: { meditationId: meditation.id }
      }));
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (isFeedbackFocused) return; // Exit early if the feedback form is focused

    if (event.key === 'ArrowLeft') {
      audioElement.currentTime = Math.max(audioElement.currentTime - 10, 0);
      updateProgress();
    } else if (event.key === 'ArrowRight') {
      audioElement.currentTime = Math.min(audioElement.currentTime + 10, audioElement.duration);
      updateProgress();
    } else if (event.key === ' ' || event.key.toLowerCase() === 'k') {
      event.preventDefault();
      togglePlayPause();
    } else if (event.key.toLowerCase() === 'm') {
      toggleMute();
    } else if (event.key === 'ArrowUp') {
      adjustVolume(0.1);
    } else if (event.key === 'ArrowDown') {
      adjustVolume(-0.1);
    }
  }

  function handleFeedbackFocus() {
    isFeedbackFocused = true;
  }

  function handleFeedbackBlur() {
    isFeedbackFocused = false;
  }

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

  function handleOverlayClick(event: MouseEvent) {
    // Check if the click was directly on the overlay and not on its children
    if (event.target === event.currentTarget) {
      toggleFeedbackVisibility();
    }
  }

  onMount(() => {
    if (audioElement && canvasElement) {
      setupCanvas();
      // Initialize AudioContext and set up visualizer
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      visualizer = setupAudioVisualizer(audioElement, canvasElement, analyser, canvasWidth, canvasHeight);
      if (visualizer) {
        visualizer.setStandbyMode(true); // Start in standby mode
      }
    } else {
      console.error('Audio or Canvas element is missing');
    }
    window.addEventListener('keydown', handleKeydown);

    // Add fade-in and unblur effect for the canvas container
    const startTime = Date.now();
    const fadeInDuration = 200; // 0.4 seconds, matching the duration in audioVisualizer.ts

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

    window.addEventListener('downloadStatusUpdate', handleDownloadStatusUpdate as EventListener);
    window.addEventListener('downloadComplete', handleDownloadComplete as EventListener);
    checkDownloadStatus();

    if (browser) {
      window.addEventListener('resize', handleResize);
    }

    // Set initial real viewport height when the component mounts
    setRealViewportHeight();

    // Add event listeners for resize and orientation change
    // This ensures our layout updates when the viewport size changes
    window.addEventListener('resize', setRealViewportHeight);
    window.addEventListener('orientationchange', setRealViewportHeight);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      // Remove event listeners on component unmount
      if (audioElement) {
        audioElement.removeEventListener('play', updatePlayingState);
        audioElement.removeEventListener('pause', updatePlayingState);
        audioElement.removeEventListener('ended', handleAudioEnded);
      }
      window.removeEventListener('downloadStatusUpdate', handleDownloadStatusUpdate as EventListener);
      window.removeEventListener('downloadComplete', handleDownloadComplete as EventListener);
      if (browser) {
        window.removeEventListener('resize', handleResize);
      }
      // Remove event listeners when the component is destroyed
      window.removeEventListener('resize', setRealViewportHeight);
      window.removeEventListener('orientationchange', setRealViewportHeight);
    };
  });

  function togglePlayPause() {
    if (audioElement.paused) {
      if (audioContext.state === 'suspended') {
        // Resume AudioContext if it's suspended (browser autoplay policy)
        audioContext.resume().then(() => {
          startPlayback();
        });
      } else {
        startPlayback();
      }
    } else {
      audioElement.pause();
      isPlaying = false;
      updateProgress();
      visualizer?.setStandbyMode(true); // Return to standby mode when paused
    }
  }

  function startPlayback() {
    audioElement.play();
    isPlaying = true;
    lastUpdateTime = Date.now();
    visualizer?.setStandbyMode(false); // Switch to active mode when playing
  }

  function updateProgress() {
    const now = Date.now();
    if (isPlaying) {
      totalPlayTime += (now - lastUpdateTime) / 1000;
    }
    lastUpdateTime = now;

    currentTime = audioElement.currentTime;
    duration = audioElement.duration;

    const minimumPlayTimeRequired = duration * 0.8;
    const timeUntilEnd = duration - currentTime;

    // send completion request if the user has listened to at least 80% of the audio and is within the last minute
    if (!lockSend && !hassentCompletionRequest && 
        (totalPlayTime >= minimumPlayTimeRequired && timeUntilEnd <= 60)) {
      lockSend = true;
      sendCompletionRequest();
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
  }

  function toggleMute() {
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
  }

  function adjustVolume(delta: number) {
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
  }

  function formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async function sendCompletionRequest() {
    if (hassentCompletionRequest) return;

    const minutesAwarded = Math.floor(duration / 60);

    try {
      await completeMeditation(meditation.id, userId, minutesAwarded);
      console.log('Meditation completion request sent');
      hassentCompletionRequest = true;
      isCompletedThisSession = true;
      showFeedbackForm = true;
      isFeedbackVisible = true;
    } catch (error) {
      lockSend = false;
      console.error('Error recording meditation completion:', error);
    }
  }

  function handleAudioEnded() {
    if (visualizer) {
      visualizer.startCelebration();
    }
  }

  function triggerDownload() {
    if (browser && (window as any).ReactNativeWebView) {
      const message = {
        type: 'download',
        payload: {
          url: audioUrl,
          filename: `meditation_${meditation.id}.mp3`,
          metadata: {
            id: meditation.id,
            title: meditation.title,
            duration: duration,
            theme: meditation.theme,
            difficulty: meditation.difficulty,
            audio_data: meditation.audio_data, // Include the audio_data here
            created_at: meditation.created_at
          }
        }
      };
      
      (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
    } else {
      alert('Please install our app to get access to offline sessions');
      console.log('Download functionality is only available in the mobile app');
      // You might want to show a toast or some other notification to the user here
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

  function toggleFeedbackVisibility() {
    isFeedbackVisible = !isFeedbackVisible;
  }

  $: showFeedbackForm = meditation.listened || !!feedback || isCompletedThisSession;

</script>

<svelte:head>
  <style>
    body {
      overflow: hidden;
    }
    main {
      padding: 0!important;
    }
    .content-container {
      padding-bottom: 0!important;
    }
  </style>
</svelte:head>

<!-- Use the realViewportHeight for the meditation-page div -->
<div class="meditation-page" style="height: {realViewportHeight}px; --background-image: url({bg});">
  <div class="back-icon" on:click={() => window.history.back()}>
    <i class="fas fa-arrow-left"></i>
  </div>
  <div class="meditation-content">
    <header>
      <h2>
        {meditation.title}
        {#if meditation.listened}
          <span class="listened-icon" title="You've listened to this meditation before">
            <i class="fas fa-check-circle"></i>
          </span>
        {/if}
      </h2>
      <div class="meditation-info">
        <span class="info-item">
          <i class="fas fa-layer-group"></i> {meditation.theme}
        </span>
        <span class="info-item">
          <i class="fas fa-signal"></i> {meditation.difficulty.charAt(0).toUpperCase() + meditation.difficulty.slice(1)}
        </span>
        <span class="info-item">
          <i class="far fa-clock"></i> {meditation.length} minutes
        </span>
        <span 
          id="download-button-{meditation.id}" 
          class="info-item {isDownloaded ? 'download-status' : 'download-icon'}" 
          on:click|stopPropagation={isDownloaded ? null : triggerDownload} 
          title={isDownloaded ? "Meditation downloaded" : "Download meditation"}
        >
          <i class="fas {isDownloaded ? 'fa-check-circle' : 'fa-download'}"></i>
          {isDownloaded ? 'Downloaded' : 'Download'}
        </span>
      </div>
    </header>

    {#if audioUrl}
      <div class="audio-player" class:hidden={isFeedbackVisible}>
        <div 
          class="canvas-container" 
          on:click={togglePlayPause} 
          style="opacity: {canvasOpacity}; filter: blur({canvasBlur}px); transition: opacity 0.2s ease-in, filter 0.1s ease-in;"
        >
          <canvas 
            bind:this={canvasElement} 
            style="width: 300px; height: 300px;"
          ></canvas>
          <div class="play-overlay" class:visible={!isPlaying}>
            <svg viewBox="0 0 24 24" width="48" height="48">
              <polygon points="5,3 19,12 5,21" fill="white"/>
            </svg>
          </div>
        </div>
        <audio
          bind:this={audioElement}
          crossorigin="anonymous"
          src={audioUrl}
          on:timeupdate={updateProgress}
          on:loadedmetadata={updateProgress}
          on:play={updatePlayingState}
          on:pause={updatePlayingState}
          on:ended={handleAudioEnded}
        ></audio>
      </div>
    {:else}
      <p class="no-audio">Audio not available for this meditation. (Audio URL: {audioUrl})</p>
    {/if}

    {#if showFeedbackForm && isFeedbackVisible}
    <div class="blurred-overlay" transition:fly={{ duration: 300 }} on:click={handleOverlayClick}>
      <div class="feedback-container">
        <div class="feedback-section" transition:fly={{ y: 500, duration: 600 }}>
          <FeedbackForm 
            sessionId={meditation.id}
            profileId={userId}
            existingFeedback={$localFeedback || feedback?.text}
            on:submit={handleFeedbackSubmit}
            on:focus={handleFeedbackFocus}
            on:blur={handleFeedbackBlur}
            on:close={toggleFeedbackVisibility}
          />
        </div>
      </div>
    </div>
  {/if}

    <div class="controls-wrapper">
      {#if showFeedbackForm}
      <button class="show-feedback-button" on:click={toggleFeedbackVisibility}>
        <i class="fas fa-comment-alt"></i>&nbsp;
        {feedback || $localFeedback ? 'Edit Feedback' : 'Add Feedback'}
        </button>
      {/if}
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
          <div class="progress-knob" style="left: calc({(currentTime / duration) * 100}% - 8px)"></div>
        </div>
        <div class="controls-row">
          <div class="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <div class="volume-control">
            <i class={`fas fa-${
              isMuted || volume === 0 ? 'volume-xmark' :
              volume < 0.2 ? 'volume-off' :
              volume < 0.5 ? 'volume-low' :
              'volume-high'
            }`} on:click={toggleMute}></i>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              bind:value={volume}
              on:input={setVolume}
              class="volume-slider"
              style="--volume-percentage: {volume * 100}%"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
/* Layout and Structure */
.controls-wrapper {
  width: 100%;
  max-width: 400px;
  position: absolute;
  bottom: 7.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.meditation-page {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  background-image: var(--background-image);
  background-size: cover;
  background-position: center;
  /* Use the CSS custom property for height, falling back to 100vh if not set */
  height: var(--real-viewport-height, 100vh);
}

.meditation-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  padding: 1.25rem;
  /* Use the CSS custom property for height, ensuring full coverage of the viewport */
  height: var(--real-viewport-height, 100vh);
  box-sizing: border-box;
}

/* Header and Meditation Info */
header {
  text-align: center;
  margin-bottom: 1.25rem;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 1.25rem;
  box-sizing: border-box;
}

h2 {
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.listened-icon {
  font-size: 1rem;
  color: #4CAF50;
  vertical-align: middle;
  padding-left: 0.5rem;
  margin-top: 0.44rem;
}

.meditation-info {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* Audio Player and Canvas */
.audio-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  transition: opacity 0.5s ease-in-out;
  /* Position the audio player absolutely in the center of the screen */
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.audio-player.hidden {
  opacity: 0;
  pointer-events: none;
}

.canvas-container {
  position: relative;
  cursor: pointer;
  margin-bottom: 1.25rem;
  opacity: 0;
  filter: blur(1.25rem);
  transition: opacity 0.4s ease-in, filter 0.4s ease-in;
}

canvas {
  display: block;
  border-radius: 50%;
  transition: filter 0.3s ease;
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

/* Progress Bar and Controls */
.custom-audio-controls {
  width: 100%;
}

.progress-container {
  width: 100%;
  height: 0.375rem;
  background-color: #d0d0d0;
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 100%;
  background-color: #007AFF;
  border-radius: 3px;
  position: absolute;
  top: 0;
  left: 0;
}

.progress-knob {
  width: 0.75rem;
  height: 0.75rem;
  background-color: #007AFF;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.2);
  transition: transform 0.1s ease;
  cursor: pointer;
}

.progress-knob::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1.5rem;
  height: 3.125rem;
  border-radius: 50%;
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

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 0.75rem;
  width: 0.75rem;
  border-radius: 50%;
  background: #007AFF;
  cursor: pointer;
  margin-top: -0.25rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1);
}

.volume-slider::-moz-range-track {
  width: 100%;
  height: 0.25rem;
  background: linear-gradient(to right, #007AFF var(--volume-percentage), #d0d0d0 var(--volume-percentage));
  border-radius: 2px;
}

.volume-slider::-webkit-slider-runnable-track {
  -webkit-appearance: none;
  width: 100%;
  height: 0.25rem;
  background: linear-gradient(to right, #007AFF var(--volume-percentage), #d0d0d0 var(--volume-percentage));
  border-radius: 2px;
}

.volume-slider::-moz-range-thumb {
  
  height: 0.75rem;
  width: 0.75rem;
  border: none;
  border-radius: 50%;
  background: #007AFF;
  cursor: pointer;
}

/* Feedback Form */
.blurred-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(0.125rem);
  -webkit-backdrop-filter: blur(0.125rem);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 800;
}

.feedback-container {
  width: 100%;
  padding: 0 1.25rem 1.25rem;
  box-sizing: border-box;
  position: relative;
  height: 22rem;
  display: flex;
  justify-content: center;
}

.feedback-section {
  margin-top: 0;
  padding: 0 1rem 0.5rem;
  background-color: #efefef;
  width: 100%;
  max-width: 40rem;
  box-sizing: border-box;
  position: absolute;
  bottom: 0;
  height: 100%;
  border-radius: 0.5rem 0.5rem 0 0;
}

.show-feedback-button,
.hide-feedback-button {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background-color: #d0d0d0;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.show-feedback-button:hover,
.hide-feedback-button:hover {
  background-color: #ffffff;
}

/* Download Button */
.download-icon {
  cursor: pointer;
  transition: color 0.3s ease;
}

.download-icon:hover {
  color: #007AFF;
}

.download-status {
  color: #4CAF50;
  cursor: default;
}

/* Utility Classes */
.no-audio {
  text-align: center;
  color: #666;
  font-style: italic;
}

.back-icon {
  background-color: blue;
  display: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .progress-knob {
    width: 1rem;
    height: 1rem;
  }

  .progress-knob:hover {
    transform: translateY(-50%) scale(1.1);
  }
}

@media (max-height: 600px) {
  .meditation-content {
    justify-content: flex-start;
  }

  .audio-player {
    flex-grow: 0;
  }

  .custom-audio-controls {
    position: static;
    transform: none;
    margin-top: 1.25rem;
  }
}

@media (max-width: 600px) {
  .meditation-page {
    margin: 0 -1.875rem;
  }

  .meditation-content {
    padding: 0.625rem;
  }

  .controls-wrapper {
    max-width: 85%;
  }

  .back-icon {
    position: absolute;
    top: 1.56rem;
    left: 1.56rem;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 1;
  }

  .back-icon i {
    font-size: 1.2rem;
    color: #333;
  }

  .volume-control {
    display: none;
  }
}
</style>