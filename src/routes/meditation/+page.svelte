<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { getMeditationStatus } from '$lib/supabase';
  import type { ActionData, PageData } from './$types';

  export let form: ActionData;
  export let data: PageData;

  let isGenerating = false;
  let retryCount = 0;
  let duration = 5;
  let generationStatus = '';

  function getUserLocalTime() {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date()).replace(/\s/g, '');
  }

  async function pollMeditationStatus(meditationId: string) {
    try {
      const result = await getMeditationStatus(meditationId);
      
      generationStatus = result.generation_status;
      
      switch (result.generation_status) {
        case 'Queued':
        case 'Fetching':
        case 'Scripting':
        case 'Generating':
        case 'Processing':
        case 'Uploading':
        case 'Saving':
          isGenerating = true;
          setTimeout(() => pollMeditationStatus(meditationId), 1000); // Poll every 5 seconds
          break;
        case 'Completed':
          isGenerating = false;
          goto(`/meditation/${meditationId}`);
          break;
        case 'Failed':
          isGenerating = false;
          form = { success: false, error: 'Meditation generation failed. Please try again.' };
          break;
        default:
          console.log('Unexpected status:', result.generation_status);
          handleError(meditationId);
      }
    } catch (error) {
      console.error('Error polling meditation status:', error);
      handleError(meditationId);
    }
  }

  function handleError(meditationId: string) {
    if (retryCount < 5) {
      retryCount++;
      setTimeout(() => pollMeditationStatus(meditationId), 5000);
    } else {
      isGenerating = false;
      form = { success: false, error: 'An error occurred while generating your meditation. Please try again later.' };
    }
  }

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
      return async ({ result }) => {
        isGenerating = false;
        if (result.type === 'success' && result.data?.success) {
          const meditationId = result.data.meditation_id;
          if (typeof meditationId === 'string') {
            pollMeditationStatus(meditationId);
          }
        }
      };
    }}
  >
    <div class="duration-slider">
      <label for="duration">Duration: <span id="duration-value">{duration}</span> minutes</label>
      <input type="range" id="duration" name="duration" min="1" max="30" bind:value={duration} />
    </div>
    <input type="hidden" name="userLocalTime" value={getUserLocalTime()} />
    <button type="submit" class="generate-btn" disabled={isGenerating}>
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

  .duration-slider input {
    margin-top: 1rem;
    width: 100%;
    -webkit-appearance: none;
    appearance: none;
    height: 10px;
    background: #ddd;
    outline: none;
    opacity: 0.7;
    transition: opacity 0.2s;
    border-radius: 5px;
  }

  .duration-slider input:hover {
    opacity: 1;
  }

  .duration-slider input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #000000;
    cursor: pointer;
    border-radius: 50%;
  }

  .duration-slider input::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #000000;
    cursor: pointer;
    border-radius: 50%;
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