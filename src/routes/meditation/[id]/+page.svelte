<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { completeMeditation, submitFeedback } from '$lib/api';
  import type { PageData } from './$types';
  import { browser } from '$app/environment';
  import FeedbackForm from '$lib/components/FeedbackForm.svelte';
  import bg from '$lib/assets/med-bg.webp';
  import { writable } from 'svelte/store';
  import { fly, slide } from 'svelte/transition';
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

  let isMenuOpen = false;

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

    const minutesAwarded = meditation.length;

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
            duration: meditation.length_ms / 1000,
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

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function handleOutsideClick(event: MouseEvent) {
    if (isMenuOpen && !(event.target as Element).closest('.menu') && !(event.target as Element).closest('.menu-icon')) {
      isMenuOpen = false;
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

    document.addEventListener('click', handleOutsideClick);

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

      document.removeEventListener('click', handleOutsideClick);
    };
  });

  $: showFeedbackForm = meditation.listened || !!feedback || isCompletedThisSession;
</script>

<svelte:head>
  <title>{meditation.title}</title>
  <style>
    body {
      overflow: hidden;
    }
    main {
      padding: 0 !important;
    }
    .content-container {
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }
  </style>
</svelte:head>

<div
  class="meditation-page"
  style="height: {realViewportHeight}px; --background-image: url({bg});"
>
  <div class="navigation-controls">
    <div class="back-icon" on:click={() => window.history.back()}>
      <i class="fas fa-arrow-left"></i> &nbsp; Back
    </div>
    <div class="menu-icon" on:click|stopPropagation={toggleMenu}>
      <i class="fas fa-ellipsis-v"></i>
    </div>
  </div>
  
  {#if isMenuOpen}
    <div class="menu" transition:slide={{ duration: 300 }}>
      <ul>
        <li
          on:click|stopPropagation={isDownloaded ? null : triggerDownload}
          aria-label={isDownloaded ? 'Meditation downloaded' : 'Download meditation'}
        >
          {isDownloaded ? 'Already downloaded' : 'Download'}
        </li>
        <li
          on:click|stopPropagation={() => {
            if (!meditation.listened && !isCompletedThisSession) {
              completeMeditation(meditation.id, userId, 0);
              isCompletedThisSession = true;
            }
          }}
        >
          {meditation.listened || isCompletedThisSession ? 'Already completed' : 'Mark as complete'}
        </li>
      </ul>
    </div>
  {/if}

  <div class="meditation-content">
    <header>
      <div class="header-content">
        <h2>
          <span class="title-wrapper">
            {#if meditation.listened}
              <span class="listened-icon" title="You've listened to this meditation before">
                <i class="fas fa-check-circle"></i>
              </span>
            {/if}
            {meditation.title}
          </span>
        </h2>
        <div class="meditation-info">
          <span class="info-item">
            <i class="fas fa-layer-group"></i> 
            {#if meditation.lesson_playlists}
              <a href="/playlists/{meditation.playlist_id}">{meditation.lesson_playlists.playlist_name}</a>
            {:else}
              {meditation.theme}
            {/if}
          </span>
          <span class="info-item">
            <i class="fas fa-signal"></i>{' '}
            {meditation.difficulty.charAt(0).toUpperCase() + meditation.difficulty.slice(1)}
          </span>
          <!-- <span class="info-item">
            <i class="far fa-clock"></i> {meditation.length} minutes
          </span> -->
          <!-- <span
            id="download-button-{meditation.id}"
            class="info-item {isDownloaded ? 'download-status' : 'download-icon'}"
            on:click|stopPropagation={isDownloaded ? null : triggerDownload}
            title={isDownloaded ? 'Meditation downloaded' : 'Download meditation'}
          >
            <i class="fas {isDownloaded ? 'fa-check-circle' : 'fa-download'}"></i>
            {isDownloaded ? 'Downloaded' : 'Download'}
          </span> -->
        </div>
      </div>
    </header>

    <AudioPlayer
      bind:this={audioPlayerComponent}
      {audioUrl}
      meditationId={meditation.id}
      duration={meditation.length_ms / 1000}
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
  /* =======================
   Layout and Structure
   ======================= */
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

/* =======================
   Header and Meditation Info
   ======================= */
header {
  position: absolute;
  top: 0.5rem;
  left: 0.25rem;
  right: 0.25rem;
  padding: 1rem;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  text-align: center;
  margin-bottom: 1.25rem;
}

.header-content {
  max-width: 500px;
}

h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.title-wrapper {
  position: relative;
  display: inline-block;
  padding-top: 2rem; /* Space above the title */
}

.listened-icon {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.9rem;
  color: #4CAF50;
}

.listened-icon i {
  border-radius: 50%;
  box-shadow: 0 0 6px 2px rgba(76, 175, 80, 0.4);
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

.info-item a {
  text-decoration: none;
  background: #666;
  border-radius: 1rem;
  padding: 0 8px;
  color: #E1E1E1;
}

/* =======================
   Navigation Controls
   ======================= */
.navigation-controls {
  position: absolute;
  top: 1.3rem;
  left: 1.5rem;
  right: 1.5rem;
  display: flex;
  justify-content: flex-end; /* Change this to align menu to the right */
  align-items: center;
  z-index: 1;
}

/* Back Icon - Hidden by Default */
.back-icon {
  display: none;
  background-color: #f5f5f5;
  border-radius: 1rem;
  height: 2rem;
  padding: 0 0.8rem;
  color: #333;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.08);
  transition: background-color 0.3s ease, opacity 0.3s ease;
  margin-right: auto; /* Push it to the left */
}

.back-icon:hover {
  opacity: 1;
}

.back-icon i {
  font-size: 1.2rem;
  color: #333;
}

/* Menu Icon - Always Visible */
.menu-icon {
  background-color: #f5f5f5;
  border-radius: 1rem;
  height: 2rem;
  padding: 0 0.8rem;
  color: #333;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.08);
  transition: background-color 0.3s ease;
}

.menu-icon:active {
  background-color: #e0e0e0;
}

.menu-icon i {
  font-size: 1.2rem;
  color: #333;
}

/* Dropdown Menu */
.menu {
  position: absolute;
  top: 3.5rem;
  right: 1.5rem;
  background-color: #efefef;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 2;
  overflow: hidden; /* This ensures the child elements don't overflow the rounded corners */
}

.menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu li {
  padding: 0.8rem 1.2rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
}

.menu li:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30%;
  height: 1px;
  background-color: #e0e0e0;
}

.menu li:hover {
  background-color: #e9e9e9;
}


/* =======================
   Feedback Form
   ======================= */
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
  position: absolute;
  bottom: 0;
  width: 100%;
  max-width: 40rem;
  height: 100%;
  padding: 0 1rem 0.5rem;
  background-color: #efefef;
  border-radius: 0.5rem 0.5rem 0 0;
  box-sizing: border-box;
  margin-top: 0;
}

.show-feedback-button,
.hide-feedback-button {
  margin-bottom: 2rem;
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  opacity: 0.9;
}

.show-feedback-button:hover,
.hide-feedback-button:hover {
  background-color: #e5e5e5;
}

.feedback-controls-wrapper {
  position: absolute;
  bottom: 7rem;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  z-index: 0;
}


/* =======================
   Utility Classes
   ======================= */
.no-audio {
  text-align: center;
  color: #666;
  font-style: italic;
}

/* =======================
   Responsive Design
   ======================= */
@media (max-width: 600px) {
  .meditation-page {
    margin: 0 -1.875rem;
  }

  .meditation-content {
    padding: 0.625rem;
  }

  .navigation-controls {
    left: 1rem;
    right: 1rem;
  }

  /* Show Back Icon on Mobile */
  .back-icon {
    display: flex;
  }

  .feedback-controls-wrapper {
    max-width: 85%;
    bottom: 9rem;
  }
}

@media (max-height: 600px) {
  .meditation-content {
    justify-content: flex-start;
  }
}
</style>