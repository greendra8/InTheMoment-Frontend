<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { completeMeditation } from '$lib/supabase';
  import { setupAudioVisualizer } from '$lib/audioVisualizer';
  import type { PageData } from './$types';

  export let data: PageData;
  const { meditation } = data;

  const audioUrl = meditation.audio_files?.[0]?.file_path;

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

  function handleKeydown(event: KeyboardEvent) {
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

  function updatePlayingState() {
    isPlaying = !audioElement.paused;
  }

  onMount(() => {
    if (audioElement && canvasElement) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
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
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      // Remove event listeners on component unmount
      if (audioElement) {
        audioElement.removeEventListener('play', updatePlayingState);
        audioElement.removeEventListener('pause', updatePlayingState);
        audioElement.removeEventListener('ended', handleAudioEnded);
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
      analyser.fftSize = 2048;
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

    const minimumPlayTimeRequired = totalPlayTime * 0.8;
    const timeUntilEnd = duration - currentTime;

    // send completion request if the user has listened to at least 80% of the audio and is within the last minute
    if (!lockSend && !hassentCompletionRequest && 
        (totalPlayTime >= minimumPlayTimeRequired && timeUntilEnd <= 60)) {
      lockSend = true;
      sendCompletionRequest();
    }
  }

  function startSeek(event: MouseEvent) {
    isSeekingProgress = true;
    seek(event);
  }

  function seeking(event: MouseEvent) {
    if (isSeekingProgress) {
      seek(event);
    }
  }

  function endSeek() {
    isSeekingProgress = false;
  }

  function seek(event: MouseEvent) {
    const progressBar = event.currentTarget as HTMLDivElement;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (event.clientX - rect.left) / rect.width;
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

    const minimumPlayTimeRequired = totalPlayTime * 0.8;
    if (totalPlayTime < minimumPlayTimeRequired) {
      lockSend = false;
      return;
    }

    const minutesAwarded = Math.floor(duration / 60);

    try {
      await completeMeditation(meditation.id, $page.data.session.user.id, minutesAwarded);
      console.log('Meditation completion request sent');
      hassentCompletionRequest = true;
    } catch (error) {
      lockSend = false;
      console.error('Error recording meditation completion:', error);
    }
  }

  function handleAudioEnded() {
    sendCompletionRequest();
    if (visualizer) {
      visualizer.startCelebration();
    }
  }
</script>

<div class="meditation-container" on:click={resumeAudioContext}>
  <header>
    <h2>
      {meditation.title}
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
      {#if meditation.listened}
      <span class="listened-icon" title="You've listened to this meditation before">
        <i class="fas fa-check-circle"></i>
      </span>
    {/if}
    </div>
  </header>

  {#if audioUrl}
    <div class="audio-player">
      <div class="canvas-container" on:click={togglePlayPause}>
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
        <div class="progress-container" on:mousedown={startSeek} on:mousemove={seeking} on:mouseup={endSeek} on:mouseleave={endSeek}>
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
</div>

<style>
  .meditation-container {
    max-width: 500px;
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
    margin-left: 0.5rem;
    font-size: 1rem;
    color: #4CAF50;
    vertical-align: middle;
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
</style>