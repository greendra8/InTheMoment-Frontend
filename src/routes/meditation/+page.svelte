<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { subscribeMeditationStatus } from '$lib/supabase';
  import type { ActionData, PageData } from './$types';
  import { onDestroy } from 'svelte';

  export let form: ActionData;
  export let data: PageData;

  let isGenerating = false;
  let duration = 5;
  let generationStatus = '';
  let buttonDisabled = false;
  let unsubscribe: (() => void) | null = null;
  let currentMeditationId: string | null = null;  // New variable to store the current meditation ID

  function getUserLocalTime() {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date()).replace(/\s/g, '');
  }

  function handleMeditationStatus(status: string) {
    generationStatus = status;
    
    switch (status) {
      case 'Queued':
      case 'Fetching':
      case 'Scripting':
      case 'Generating':
      case 'Processing':
      case 'Uploading':
      case 'Saving':
        isGenerating = true;
        break;
      case 'Completed':
        isGenerating = false;
        buttonDisabled = false;
        if (unsubscribe) unsubscribe();
        if (currentMeditationId) {  // Use the stored meditation ID
          goto(`/meditation/${currentMeditationId}`);
        } else {
          console.error('No meditation ID available for navigation');
        }
        break;
      case 'Failed':
        isGenerating = false;
        buttonDisabled = false;
        if (unsubscribe) unsubscribe();
        form = { success: false, error: 'Meditation generation failed. Please try again.' };
        break;
      default:
        console.log('Unexpected status:', status);
        isGenerating = false;  // Add this line to handle unexpected statuses
        buttonDisabled = false;  // Add this line to re-enable the button
    }
  }

  function handleFormSubmit() {
    buttonDisabled = true;
    isGenerating = true;
  }

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

  function getStatusMessage(status: string): string {
    switch (status) {
      case 'Queued':
        return 'Your meditation is in the queue...';
      case 'Fetching':
        return 'Fetching meditation details...';
      case 'Scripting':
        return 'Crafting your personalized meditation script...';
      case 'Generating':
        return 'Generating your meditation audio...';
      case 'Processing':
        return 'Processing your meditation...';
      case 'Uploading':
        return 'Uploading your meditation...';
      case 'Saving':
      case 'Completed':
        return 'Saving your meditation...';
      default:
        return 'Generating your meditation...';
    }
  }

</script>

<div class="meditation-container">
  <h1>New Meditation</h1>

  <form
    method="POST"
    action="?/generateMeditation"
    use:enhance={() => {
      handleFormSubmit();
      return async ({ result }) => {
        if (result.type === 'success' && result.data?.success) {
          const meditationId = result.data.meditation_id;
          if (typeof meditationId === 'string') {
            currentMeditationId = meditationId;  // Store the meditation ID
            unsubscribe = subscribeMeditationStatus(meditationId, handleMeditationStatus);
          }
        } else {
          isGenerating = false;
          buttonDisabled = false;
        }
      };
    }}
  >
    <div class="duration-slider">
      <label for="duration">Duration: <span id="duration-value">{duration}</span> minutes</label>
      <div class="slider-container">
        <input 
          type="range" 
          id="duration" 
          name="duration" 
          min="1" 
          max="30" 
          bind:value={duration} 
        />
        <div class="slider-progress" style="width: {(duration - 1) / 29 * 100}%"></div>
        <div class="slider-thumb" style="left: calc({(duration - 1) / 29 * 100}% - 10px)"></div>
      </div>
    </div>
    <input type="hidden" name="userLocalTime" value={getUserLocalTime()} />
    <button type="submit" class="generate-btn" disabled={buttonDisabled}>
      <i class="fas fa-paper-plane"></i>
      <span>Generate Meditation</span>
    </button>
  </form>

  {#if isGenerating}
    <div class="generating-message">
      <p><i class="fas fa-spinner fa-spin"></i> &nbsp; {getStatusMessage(generationStatus)}</p>
    </div>
  {/if}

  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
</div>

<style>
  .meditation-container {
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
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
    color: white;
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
</style>