<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { completeMeditation, submitFeedback } from '$lib/supabase';
  import type { PageData } from './$types';
  import { browser } from '$app/environment';
  import FeedbackForm from '$lib/components/FeedbackForm.svelte';
  import bg from '$lib/assets/med-bg.webp';
  import { writable } from 'svelte/store';
  import { fly } from 'svelte/transition';
  import AudioPlayer from './AudioPlayer.svelte';

  export let data: PageData;
  const { meditation, userId, feedback } = data;

  const audioUrl = meditation.signedAudioUrl;

  let isCompletedThisSession = false;
  let showFeedbackForm = meditation.listened || !!feedback || isCompletedThisSession;
  let isFeedbackVisible = false;

  let isFeedbackFocused = false;

  let localFeedback = writable(feedback?.text || '');

  // Store the real viewport height, accounting for mobile browser UI
  let realViewportHeight: number;

  let audioPlayerComponent;

  function setRealViewportHeight() {
    realViewportHeight = window.innerHeight;
    document.documentElement.style.setProperty('--real-viewport-height', `${realViewportHeight}px`);
  }

  function handleResize() {
    setRealViewportHeight();
  }

  async function handleFeedbackSubmit(event: CustomEvent) {
    const { sessionId, profileId, feedback } = event.detail;
    console.log('Handling feedback submission:', { sessionId, profileId, feedback });
    try {
      const result = await submitFeedback(sessionId, profileId, feedback);
      console.log('Feedback submitted successfully:', result);
      localFeedback.set(feedback);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (isFeedbackFocused) return; // Exit early if the feedback form is focused

    if (event.key === 'ArrowLeft') {
      audioPlayerComponent.seekBackward(10);
    } else if (event.key === 'ArrowRight') {
      audioPlayerComponent.seekForward(10);
    } else if (event.key === ' ' || event.key.toLowerCase() === 'k') {
      event.preventDefault();
      audioPlayerComponent.togglePlayPause();
    } else if (event.key.toLowerCase() === 'm') {
      audioPlayerComponent.toggleMute();
    } else if (event.key === 'ArrowUp') {
      audioPlayerComponent.adjustVolume(0.1);
    } else if (event.key === 'ArrowDown') {
      audioPlayerComponent.adjustVolume(-0.1);
    }
  }

  function handleFeedbackFocus() {
    isFeedbackFocused = true;
  }

  function handleFeedbackBlur() {
    isFeedbackFocused = false;
  }

  function toggleFeedbackVisibility() {
    isFeedbackVisible = !isFeedbackVisible;
  }

  async function sendCompletionRequest() {
    if (isCompletedThisSession) return;

    const minutesAwarded = Math.floor(meditation.length);

    try {
      await completeMeditation(meditation.id, userId, minutesAwarded);
      console.log('Meditation completion request sent');
      isCompletedThisSession = true;
      showFeedbackForm = true;
      isFeedbackVisible = true;
    } catch (error) {
      console.error('Error recording meditation completion:', error);
    }
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      toggleFeedbackVisibility();
    }
  }

  // Download handling code
  let isDownloaded = false;

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
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'checkDownloadStatus',
          payload: { meditationId: meditation.id },
        })
      );
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
            duration: meditation.length * 60,
            theme: meditation.theme,
            difficulty: meditation.difficulty,
            audio_data: meditation.audio_data,
            created_at: meditation.created_at,
          },
        },
      };

      (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
    } else {
      alert('Please install our app to get access to offline sessions');
      console.log('Download functionality is only available in the mobile app');
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);

    if (browser) {
      window.addEventListener('resize', handleResize);
    }
    setRealViewportHeight();
    window.addEventListener('resize', setRealViewportHeight);
    window.addEventListener('orientationchange', setRealViewportHeight);

    // Download event listeners
    window.addEventListener('downloadStatusUpdate', handleDownloadStatusUpdate as EventListener);
    window.addEventListener('downloadComplete', handleDownloadComplete as EventListener);
    checkDownloadStatus();

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      if (browser) {
        window.removeEventListener('resize', handleResize);
      }
      window.removeEventListener('resize', setRealViewportHeight);
      window.removeEventListener('orientationchange', setRealViewportHeight);

      // Remove download event listeners
      window.removeEventListener('downloadStatusUpdate', handleDownloadStatusUpdate as EventListener);
      window.removeEventListener('downloadComplete', handleDownloadComplete as EventListener);
    };
  });

  $: showFeedbackForm = meditation.listened || !!feedback || isCompletedThisSession;
</script>

<svelte:head>
  <style>
    body {
      overflow: hidden;
    }
    main {
      padding: 0 !important;
    }
    .content-container {
      padding-bottom: 0 !important;
    }
  </style>
</svelte:head>

<div
  class="meditation-page"
  style="height: {realViewportHeight}px; --background-image: url({bg});"
>
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
          <i class="fas fa-signal"></i>{' '}
          {meditation.difficulty.charAt(0).toUpperCase() + meditation.difficulty.slice(1)}
        </span>
        <span class="info-item">
          <i class="far fa-clock"></i> {meditation.length} minutes
        </span>
        <span
          id="download-button-{meditation.id}"
          class="info-item {isDownloaded ? 'download-status' : 'download-icon'}"
          on:click|stopPropagation={isDownloaded ? null : triggerDownload}
          title={isDownloaded ? 'Meditation downloaded' : 'Download meditation'}
        >
          <i class="fas {isDownloaded ? 'fa-check-circle' : 'fa-download'}"></i>
          {isDownloaded ? 'Downloaded' : 'Download'}
        </span>
      </div>
    </header>

    <AudioPlayer
      bind:this={audioPlayerComponent}
      {audioUrl}
      meditationId={meditation.id}
      duration={meditation.length * 60}
      {userId}
      {isFeedbackVisible}
      {sendCompletionRequest}
    />

    {#if showFeedbackForm && isFeedbackVisible}
      <div
        class="blurred-overlay"
        transition:fly={{ duration: 300 }}
        on:click={handleOverlayClick}
      >
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

    <div class="feedback-controls-wrapper">
      {#if showFeedbackForm}
        <button class="show-feedback-button" on:click={toggleFeedbackVisibility}>
          <i class="fas fa-comment-alt"></i>&nbsp;
          {feedback || $localFeedback ? 'Edit Feedback' : 'Add Feedback'}
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Full styles for the main component */

  /* Layout and Structure */
  .meditation-page {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    background-image: var(--background-image);
    background-size: cover;
    background-position: center;
    height: var(--real-viewport-height, 100vh);
  }

  .meditation-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    padding: 1.25rem;
    height: var(--real-viewport-height, 100vh);
    box-sizing: border-box;
  }

  /* Header and Meditation Info */
  header {
    text-align: center;
    margin-bottom: 1.25rem;
    position: absolute;
    top: 1rem;
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
    background-color: #f5f5f5;
    color: #333;
    border: none;
    border-radius: 0.425rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .show-feedback-button:hover,
  .hide-feedback-button:hover {
    background-color: #e5e5e5;
  }

  .feedback-controls-wrapper {
    width: 100%;
    max-width: 400px;
    position: absolute;
    bottom: 7rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  @media (max-width: 600px) {
    .feedback-controls-wrapper {
      max-width: 85%;
      bottom: 9rem;
    }
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
    display: none;
  }

  /* Responsive Design */
  @media (max-width: 600px) {
    .meditation-page {
      margin: 0 -1.875rem;
    }

    .meditation-content {
      padding: 0.625rem;
    }

    .back-icon {
      display: block;
      position: absolute;
      top: 1.56rem;
      left: 1.56rem;
      background-color: #f5f5f5;
      border-radius: 50%;
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      z-index: 1;
    }

    .back-icon:hover {
      background-color: #d3d3d3;
    }

    .back-icon i {
      font-size: 1.2rem;
      color: #333;
    }
  }

  @media (max-height: 600px) {
    .meditation-content {
      justify-content: flex-start;
    }
  }
</style>