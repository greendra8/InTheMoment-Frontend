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
  import { fly } from 'svelte/transition';

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

  onMount(() => {
    if (audioElement && canvasElement) {
      setupCanvas();
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      visualizer = setupAudioVisualizer(audioElement, canvasElement, analyser, canvasWidth, canvasHeight);
      
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

    if (browser) {
      window.addEventListener('resize', handleResize);
    }

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

<div class="meditation-page" style="height: {contentHeight}px; --background-image: url({bg});">
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
      <div class="audio-player">
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


    {#if showFeedbackForm}
    <button class="show-feedback-button" on:click={toggleFeedbackVisibility}>
      <i class="fas fa-comment-alt"></i>&nbsp;
      {feedback ? 'Edit Feedback' : 'Add Feedback'}
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

  {#if showFeedbackForm && isFeedbackVisible}
    <div class="blurred-overlay" transition:fly={{ duration: 300 }}>
      <div class="feedback-container">
        <div class="feedback-section" transition:fly={{ y: 500, duration: 500 }}>
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
</div>


<style>
  .meditation-page {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    background-image: var(--background-image);
    background-size: cover;
    background-position: center;
  }

  .meditation-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    padding: 20px;
  }

  header {
    text-align: center;
    margin-bottom: 20px;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 20px;
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
    justify-content: center;
    flex-grow: 1;
  }

  .canvas-container {
    position: relative;
    cursor: pointer;
    margin-bottom: 20px;
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

  .custom-audio-controls {
    width: 100%;
    max-width: 400px;
    position: absolute;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%);
  }

  .progress-container {
    width: 100%;
    height: 6px;
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
    width: 12px;
    height: 12px;
    background-color: #007AFF;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.1s ease;
    cursor: pointer;
  }

  .progress-knob::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 50px;
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

  .volume-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .volume-control i {
    width: 16px;  /* Set a fixed width */
    text-align: center;  /* Center the icon within its container */
    font-size: 16px;  /* Set a consistent font size */
    color: #d0d0d0;
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
    background: linear-gradient(to right, #007AFF var(--volume-percentage), #d0d0d0 var(--volume-percentage));
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

  .back-icon {
    background-color: blue;
    display: none;
  }

  .blurred-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 800;
  }

  .feedback-container {
    width: 100%;
    padding: 0 20px 20px;
    box-sizing: border-box;
    position: relative;
    height: 380px;
  }

  .feedback-section {
    margin-top: 0;
    padding: 0 1rem 0.5rem;
    background-color: #efefef;
    width: 100%;
    box-sizing: border-box;
    position: absolute;
    bottom: 0px;
    margin-left: -1rem;
    height: 100%;
  }

  .show-feedback-button {
    display: block;
    margin-left: auto;
    margin-right: auto;
    /* keep in line with the right edge of audio controls */
    transform: translateX(64%);
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #d0d0d0;
    color: #333;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    position: absolute;
    bottom: 180px;
  }

  .show-feedback-button:hover,
  .hide-feedback-button:hover {
    background-color: #555;
  }


  .hide-feedback-button {
    display: block;
    margin-top: 1rem;
    margin-left: auto;
    margin-right: auto;
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
      margin-top: 20px;
    }
  }

  @media (max-width: 600px) {
    .meditation-page {
      margin: 0 -30px;
    }
    .meditation-content {
      padding: 10px;
    }

    /* keep feedback button on right, and aligned with audio controls */
    .show-feedback-button {
      transform: none;
      right: 7.5%;
    }

    .custom-audio-controls {
      max-width: 85%;
    }

    .back-icon {
    position: absolute;
    top: 25px;
    left: 25px;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    width: 40px;
    height: 40px;
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