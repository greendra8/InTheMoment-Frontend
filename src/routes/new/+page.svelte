<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { subscribeMeditationStatus } from '$lib/api';
  import type { PageData } from './$types';
  import { onMount, onDestroy } from 'svelte';
  import { spring } from 'svelte/motion';

  export let data: PageData;

  let activeTab: 'custom' | 'lesson' = data.initialTab;
  let selectedPlaylist = data.selectedPlaylist ? data.selectedPlaylist.id : '';
  let selectedLesson = '';

  interface CustomActionData {
    type: 'success' | 'error';
    status?: number;
    data?: string;
    message?: string;
  }

  let form: CustomActionData | null = null;

  let isGenerating = false;
  let duration = 15;
  let generationStatus = '';
  let buttonDisabled = false;
  let unsubscribe: (() => void) | null = null;
  let currentMeditationId: string | null = null;

  let postureOptions = [
    { value: 'sitting', display: 'Sitting', icon: 'fa-chair' },
    { value: 'lying', display: 'Lying Down', icon: 'fa-bed' },
    { value: 'walking', display: 'Walking', icon: 'fa-walking' }
  ];
  let eyesOptions = [
    { value: 'open', display: 'Open', icon: 'fa-eye' },
    { value: 'closed', display: 'Closed', icon: 'fa-eye-slash' }
  ];
  let selectedPosture = postureOptions[0].value;
  let selectedEyes = eyesOptions[1].value;

  let postureSpring = spring(0);
  let eyesSpring = spring(0);

  let selectedPostureIndex = 0;
  let selectedEyesIndex = 1;

  $: {
    selectedPostureIndex = postureOptions.findIndex(option => option.value === selectedPosture);
  }

  $: {
    selectedEyesIndex = eyesOptions.findIndex(option => option.value === selectedEyes);
  }

  $: {
    postureSpring.set(selectedPostureIndex);
  }

  $: {
    eyesSpring.set(selectedEyesIndex);
  }

  $: isWalking = selectedPosture === postureOptions[2].value;

  $: {
    if (isWalking) {
      selectedEyes = eyesOptions[0].value; // Set to "Open" when walking
    }
  }

  function getUserLocalTime() {
    const time = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date()).replace(/\s/g, '');
    return time;
  }

  function getStatusMessage(status: string): string {
    console.log('status', status);
    switch (status) {
      case 'Queued':
      case '':
        return 'Your meditation is in the queue...';
      case 'Fetching':
        return 'Fetching meditation details...';
      case 'Scripting':
        return 'Crafting your personalized meditation script...';
      case 'Reviewing':
        return 'Reviewing your meditation script...';
      case 'Audio Generation':
        return 'Generating your meditation audio...';
      case 'Processing':
        return 'Processing your meditation...';
      case 'Uploading':
        return 'Uploading your meditation...';
      case 'Saving':
        return 'Saving your meditation...';
      case 'Completed':
        return 'Your meditation is ready!';
      case 'Failed':
        return 'Meditation generation failed. Please try again.';
      default:
        return 'Starting your generation...';
    }
  }

  function handleMeditationStatus(status: string) {
    generationStatus = status;
    
    switch (status) {
      case 'Queued':
      case 'Fetching':
      case 'Scripting':
      case 'Reviewing':
      case 'Generating':
      case 'Audio Generation':
      case 'Processing':
      case 'Uploading':
      case 'Saving':
        isGenerating = true;
        buttonDisabled = true;
        break;
      case 'Completed':
        isGenerating = false;
        buttonDisabled = false;
        if (unsubscribe) unsubscribe();
        if (currentMeditationId) {
          goto(`/meditation/${currentMeditationId}`);
        } else {
          console.error('No meditation ID available for navigation');
        }
        break;
      case 'Failed':
        isGenerating = false;
        buttonDisabled = false;
        if (unsubscribe) unsubscribe();
        form = { type: 'error', message: 'Meditation generation failed. Please try again.' };
        break;
      default:
        isGenerating = true;
        buttonDisabled = true;
    }
  }

  function createParametersJSON() {
    const params: any = {
      posture: selectedPosture,
      eyes: selectedEyes
    };
    if (activeTab === 'lesson') {
      params.playlist_id = selectedPlaylist;
    }
    return params;
  }

  let formElement: HTMLFormElement;

  async function handleFormSubmit(event: Event) {
    console.log('Client: handleFormSubmit called');
    event.preventDefault();
    buttonDisabled = true;
    isGenerating = true;
    generationStatus = 'Queued'; // Set initial status

    const formData = new FormData(formElement);
    formData.set('userLocalTime', getUserLocalTime());
    formData.set('length', duration.toString());
    formData.set('parameters', JSON.stringify(createParametersJSON()));
    if (activeTab === 'lesson') {
      formData.set('playlist_id', selectedPlaylist);
    }

    console.log('Client: Form data:', Object.fromEntries(formData));

    try {
      const response = await fetch(formElement.action, {
        method: 'POST',
        body: formData
      });

      console.log('Client: Response status:', response.status);

      const result: CustomActionData = await response.json();
      console.log('Client: Result:', JSON.stringify(result, null, 2));

      if (result.type === 'success' && result.data) {
        let parsedData;
        try {
          parsedData = JSON.parse(result.data);
        } catch (e) {
          console.error('Failed to parse result.data:', e);
          throw new Error('Invalid data format');
        }

        const meditationId = parsedData[3]; // The meditation ID is the fourth element in the array
        if (typeof meditationId === 'string') {
          console.log('Client: Valid meditation ID:', meditationId);
          currentMeditationId = meditationId;
          unsubscribe = subscribeMeditationStatus(meditationId, handleMeditationStatus);
        } else {
          throw new Error('Invalid server response. We might be offline.'); // Invalid meditation ID
        }
      } else {
        throw new Error(result.message || 'Failed to generate meditation');
      }
    } catch (error: unknown) {
      console.error('Client: Error in handleFormSubmit:', error);
      form = { type: 'error', message: error instanceof Error ? error.message : 'An unexpected error occurred' };
      isGenerating = false;
      buttonDisabled = false;
    }
  }

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

</script>

<div class="meditation-container">
  <h1>New Meditation</h1>

  <div class="tabs">
    <button class:active={activeTab === 'custom'} on:click={() => activeTab = 'custom'}>Custom Session</button>
    <button class:active={activeTab === 'lesson'} on:click={() => activeTab = 'lesson'}>Lesson</button>
  </div>

  {#if activeTab === 'lesson'}
    <div class="playlist-selector">
      <label for="playlist-select">Select a playlist:</label>
      <div class="select-wrapper">
        <select id="playlist-select" bind:value={selectedPlaylist}>
          <option value="">Choose a playlist</option>
          {#each data.playlists as playlist}
            <option value={playlist.id}>{playlist.playlist_name}</option>
          {/each}
        </select>
      </div>
    </div>
  {/if}

  <div class="options-container">
    <div class="option-group">
      <h3>Posture</h3>
      <div class="sliding-checkbox" style="--option-count: {postureOptions.length};">
        <div class="slider-background" style="transform: translateX({100 * selectedPostureIndex}%)"></div>
        {#each postureOptions as posture, i}
          <label class="option">
            <input
              type="radio"
              name="posture"
              value={posture.value}
              bind:group={selectedPosture}
              hidden
            >
            <div class="option-content" class:selected={i === selectedPostureIndex}>
              <i class="fas {posture.icon}"></i>
              <span>{posture.display}</span>
            </div>
          </label>
        {/each}
      </div>
    </div>
    <div class="option-group">
      <h3>Eyes</h3>
      <div class="sliding-checkbox" style="--option-count: {eyesOptions.length}; opacity: {isWalking ? 0.5 : 1};">
        <div class="slider-background" style="transform: translateX({100 * selectedEyesIndex}%)"></div>
        {#each eyesOptions as eye, i}
          <label class="option">
            <input
              type="radio"
              name="eyes"
              value={eye.value}
              bind:group={selectedEyes}
              disabled={isWalking}
              hidden
            >
            <div class="option-content" class:selected={i === selectedEyesIndex}>
              <i class="fas {eye.icon}"></i>
              <span>{eye.display}</span>
            </div>
          </label>
        {/each}
      </div>
    </div>
  </div>

  <div class="duration-slider">
    <label for="duration">Duration: <span id="duration-value">{duration}</span> minutes</label>
    <div class="slider-container">
      <input 
        type="range" 
        id="duration" 
        name="duration" 
        min="10" 
        max="45" 
        bind:value={duration} 
      />
      <div class="slider-progress" style="width: {(duration - 10) / 35 * 100}%"></div>
      <div class="slider-thumb" style="left: calc({(duration - 10) / 35 * 100}% - 10px)"></div>
    </div>
  </div>

  <form bind:this={formElement} method="POST" action="?/generateMeditation" on:submit={handleFormSubmit}>
    <input type="hidden" name="userLocalTime" value={getUserLocalTime()} />
    <input type="hidden" name="length" value={duration} />
    <input type="hidden" name="parameters" value={JSON.stringify(createParametersJSON())} />
    {#if activeTab === 'lesson'}
      <input type="hidden" name="playlist_id" value={selectedPlaylist} />
    {/if}
    <button type="submit" class="generate-btn" disabled={buttonDisabled || (activeTab === 'lesson' && !selectedPlaylist)}>
      <i class="fas fa-paper-plane"></i>
      <span>Generate Meditation</span>
    </button>
  </form>

  {#if isGenerating}
    <div class="generating-message">
      <p><i class="fas fa-spinner fa-spin"></i> &nbsp; {getStatusMessage(generationStatus)}</p>
    </div>
  {/if}

  {#if form?.type === 'error'}
    <p class="error">{form.message}</p>
  {/if}
</div>

<style>
  :global(body) {
    font-family: 'Lato', sans-serif;
  }

  h1, h2, h3 {
    font-family: 'Poppins', sans-serif;
  }

  .meditation-container {
    max-width: 600px;
    margin: 0 auto;
  }

  h1 {
    margin-bottom: 2rem;
  }
  .duration-slider {
    margin-bottom: 2rem;
    text-align: left;
  }

  .duration-slider label {
    display: block;
    margin-bottom: 0.5rem;
  }

  .slider-container {
    position: relative;
    width: 100%;
    height: 20px;
    background: #ddd;
    border-radius: 5px;
  }

  .slider-progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: #000000;
    border-radius: 5px;
    pointer-events: none;
  }

  .slider-thumb {
    position: absolute;
    top: 50%;
    width: 25px;
    height: 25px;
    background: #ffffff;
    border: 2px solid #000000;
    border-radius: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    z-index: 2;
  }

  .duration-slider input {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 20px;
    background: transparent;
    outline: none;
    margin: 0;
    padding: 0;
    cursor: pointer;
    position: relative;
    z-index: 1;
  }

  .duration-slider input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 25px;
    height: 25px;
    background: transparent;
    cursor: pointer;
  }

  .duration-slider input::-moz-range-thumb {
    width: 25px;
    height: 25px;
    background: transparent;
    cursor: pointer;
    border: none;
  }

  .generate-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background-color: #333;
    color: #e1e1e1;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.1s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .generate-btn:hover {
    background-color: #000;
    transform: translateY(-1px);
  }

  .generate-btn:active {
    transform: translateY(1px);
  }

  .generate-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
  }

  .generate-btn i {
    font-size: 1.2rem;
  }

  .generate-btn span {
    font-weight: 500;
  }

  .generating-message {
    font-style: italic;
    margin-top: 1rem;
  }

  .error {
    color: red;
    margin-top: 1rem;
  }

  .options-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .option-group {
    text-align: left;
  }

  .option-group h3 {
    margin-bottom: 0.5rem;
  }

  .sliding-checkbox {
    display: flex;
    background-color: transparent;
    border: 1px solid #706b5780;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    transition: opacity 0.3s ease;
  }

  .slider-background {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(100% / var(--option-count));
    height: 100%;
    background-color: #333;
    transition: transform 0.3s ease;
  }

  .option {
    flex: 1;
    padding: 0.5rem;
    text-align: center;
    cursor: pointer;
    position: relative;
    z-index: 1;
  }

  .option-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: color 1s ease;
    color: #333;
  }

  .option-content.selected {
    color: #e1e1e1;
  }

  .option i {
    display: block;
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

  .option span {
    font-size: 0.8rem;
  }

  .tabs {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #706b5780;
  }

  .tabs button {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    background-color: transparent;
    cursor: pointer;
    transition: background-color 0.3s ease, color 0.3s ease;
    font-size: 1rem;
    font-weight: 500;
  }

  .tabs button.active {
    background-color: #333;
    color: #e1e1e1;
  }

  .playlist-selector {
    margin-bottom: 2rem;
    text-align: left;
  }

  .playlist-selector label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .playlist-selector select {
    background-color: #e1e1e1 !important;
    border: 1px solid #706b5780 !important;
  }

  .select-wrapper {
    position: relative;
  }

  .select-wrapper::after {
    content: '\25BC';
    position: absolute;
    top: 50%;
    right: 1rem;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .playlist-selector select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    font-size: 1rem;
    appearance: none;
    cursor: pointer;
  }

  .playlist-selector select:focus {
    outline: none;
    border-color: #333;
    box-shadow: 0 0 0 2px rgba(51, 51, 51, 0.2);
  }
</style>