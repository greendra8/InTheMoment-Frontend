<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { completeMeditation, submitFeedback } from '$lib/supabase';
  import { setupAudioVisualizer } from '$lib/audioVisualizer';
  import type { PageData } from './$types';
  import { browser } from '$app/environment';
  import FeedbackForm from '$lib/components/FeedbackForm.svelte';

  export let data: PageData;
  const { meditation, userId, feedback } = data;

  const audioUrl = meditation.file_path;

  let audioElement: HTMLAudioElement;
  let canvasElement: HTMLCanvasElement;
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

  let visualizer: { startCelebration: () => void } | null = null;

  let canvasOpacity = 0;
  let canvasBlur = 3; // Initial blur amount in pixels

  let isDownloaded = false;

  let showFeedbackForm = meditation.listened || !!feedback;
  let isFeedbackVisible = !feedback; // Initialize to true if no feedback exists

  let isFeedbackFocused = false;

  let feedbackConfirmation = '';
  let showFeedbackConfirmation = false;

  async function handleFeedbackSubmit(event: CustomEvent) {
    const { sessionId, profileId, feedback } = event.detail;
    console.log('Handling feedback submission:', { sessionId, profileId, feedback });
    try {
      const result = await submitFeedback(sessionId, profileId, feedback);
      console.log('Feedback submitted successfully:', result);
      feedbackConfirmation = 'Feedback submitted successfully!';
      showFeedbackConfirmation = true;
      setTimeout(() => {
        showFeedbackConfirmation = false;
      }, 3000); // Hide the confirmation after 3 seconds
    } catch (error) {
      console.error('Error submitting feedback:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      feedbackConfirmation = 'Error submitting feedback. Please try again.';
      showFeedbackConfirmation = true;
      setTimeout(() => {
        showFeedbackConfirmation = false;
      }, 3000); // Hide the error message after 3 seconds
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

  onMount(() => {
    if (audioElement && canvasElement) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      visualizer = setupAudioVisualizer(audioElement, canvasElement, analyser);
      
      // Add event listeners for play and pause events
      audioElement.addEventListener('play', updatePlayingState);
      audioElement.addEventListener('pause', updatePlayingState);
      audioElement.addEventListener('ended', handleAudioEnded);
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
    };
  });

  function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
      });
    }
  }

  function togglePlayPause() {
    if (audioElement.paused) {
      if (!audioContext) {
        setupRealAudio();
      }
      audioElement.play().then(() => {
        isPlaying = true;
        lastUpdateTime = Date.now();
      }).catch(error => {
        console.error('Error playing audio:', error);
      });
    } else {
      audioElement.pause();
      isPlaying = false;
      updateProgress(); // Ensure we update the total play time when pausing
    }
  }

  function setupRealAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 32;
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      setupAudioVisualizer(audioElement, canvasElement, analyser);
    }
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
      console.log('Download functionality is only available in the mobile app');
      // You might want to show a toast or some other notification to the user here
    }
  }

  function toggleFeedbackVisibility() {
    isFeedbackVisible = !isFeedbackVisible;
  }
</script>

<div class="meditation-container" on:click={resumeAudioContext}>
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
    <div class="audio-player">
      <div 
        class="canvas-container" 
        on:click={togglePlayPause} 
        style="opacity: {canvasOpacity}; filter: blur({canvasBlur}px); transition: opacity 0.2s ease-in, filter 0.1s ease-in;"
      >
        <canvas bind:this={canvasElement} width="300" height="300"></canvas>
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
  {:else}
    <p class="no-audio">Audio not available for this meditation. (Audio URL: {audioUrl})</p>
  {/if}

  {#if showFeedbackForm}
    {#if isFeedbackVisible}
      <div class="feedback-section">
        <h3>Your Feedback</h3>
        <FeedbackForm 
          sessionId={meditation.id}
          profileId={userId}
          existingFeedback={feedback?.text}
          on:submit={handleFeedbackSubmit}
          on:focus={handleFeedbackFocus}
          on:blur={handleFeedbackBlur}
        />
        {#if showFeedbackConfirmation}
          <div class="feedback-confirmation" class:error={feedbackConfirmation.includes('Error')}>
            {feedbackConfirmation}
          </div>
        {/if}
        {#if feedback}
          <button class="hide-feedback-button" on:click={toggleFeedbackVisibility}>Hide Feedback</button>
        {/if}
      </div>
    {:else}
      <button class="show-feedback-button" on:click={toggleFeedbackVisibility}>
        View/Edit Feedback
      </button>
    {/if}
  {/if}
</div>

<style>
  .meditation-container {
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  }

  header {
    text-align: center;
    margin-bottom: 1.5rem;
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
    /* move it down a bit */
    margin-top: 7px;
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

  .audio-player {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .canvas-container {
    position: relative;
    cursor: pointer;
    margin-bottom: 1rem;
    opacity: 0;
    filter: blur(20px);
    transition: opacity 0.4s ease-in, filter 0.4s ease-in;
  }

  canvas {
    display: block;
    border-radius: 50%;
    transition: filter 0.3s ease;
  }

  .play-overlay {
    filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.25));
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
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .play-overlay.visible {
    opacity: 1;
  }

  .play-overlay.visible + canvas {
    filter: blur(50px);
  }

  .custom-audio-controls {
    width: 100%;
  }

  .progress-container {
    width: 100%;
    height: 6px;
    background-color: #e0e0e0;
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
    width: 12px;
    height: 12px;
    background-color: #007AFF;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.1s ease;
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
    color: #666;
  }

  .volume-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .volume-control i {
    width: 16px;  /* Set a fixed width */
    text-align: center;  /* Center the icon within its container */
    font-size: 16px;  /* Set a consistent font size */
  }

  .volume-slider {
    width: 80px;
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: #007AFF;
    cursor: pointer;
    margin-top: -4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .volume-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    background: linear-gradient(to right, #007AFF var(--volume-percentage), #e0e0e0 var(--volume-percentage));
    border-radius: 2px;
  }

  .volume-slider::-moz-range-thumb {
    height: 12px;
    width: 12px;
    border: none;
    border-radius: 50%;
    background: #007AFF;
    cursor: pointer;
  }

  .volume-slider::-moz-range-track {
    width: 100%;
    height: 4px;
    background: linear-gradient(to right, #007AFF var(--volume-percentage), #e0e0e0 var(--volume-percentage));
    border-radius: 2px;
  }

  .no-audio {
    text-align: center;
    color: #666;
    font-style: italic;
  }

  /* Add this to your existing styles or in the head of your HTML */
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css');

  /* media query for mobile screens */
  @media (max-width: 600px) {
    .custom-audio-controls {
      width: calc(100% - 20px);
      max-width: 600px;
      margin: 0 auto;
    }
  }

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

  @media (max-width: 768px) {
    

    .progress-knob {
      width: 16px;
      height: 16px;
    }

    .progress-knob:hover {
      transform: translateY(-50%) scale(1.1);
    }
  }

  .feedback-section {
    margin-top: 2rem;
    padding: 1rem;
    background-color: rgb(232, 232, 232);
    border-radius: 20px;
    width: 100%;
    box-sizing: border-box;
  }

  .feedback-section h3 {
    margin-bottom: 1rem;
    color: #333;
  }

  .show-feedback-button,
  .hide-feedback-button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #333;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .show-feedback-button:hover,
  .hide-feedback-button:hover {
    background-color: #555;
  }

  .show-feedback-button {
    display: block;
    margin-left: auto;
    margin-right: auto;
  }

  .hide-feedback-button {
    display: block;
    margin-top: 1rem;
    margin-left: auto;
    margin-right: auto;
  }

  .feedback-confirmation {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    background-color: #4CAF50;
    color: white;
    text-align: center;
    transition: opacity 0.3s ease;
  }

  .feedback-confirmation.error {
    background-color: #f44336;
  }
</style>