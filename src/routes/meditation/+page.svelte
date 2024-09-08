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

  async function pollMeditationStatus(meditationId: string) {
    try {
      const result = await getMeditationStatus(meditationId);
      
      if (result.generation_status === 'completed') {
        isGenerating = false;
        goto(`/meditation/${meditationId}`);
      } else if (result.generation_status === 'processing') {
        isGenerating = true;
        setTimeout(() => pollMeditationStatus(meditationId), 5000); // Poll every 5 seconds
      } else {
        console.log('Unexpected status:', result.generation_status);
        handleError();
      }
    } catch (error) {
      console.error('Error polling meditation status:', error);
      handleError();
    }
  }

  function handleError() {
    if (retryCount < 3) {
      retryCount++;
      setTimeout(() => pollMeditationStatus(meditationId), 5000);
    } else {
      isGenerating = false;
      form = { success: false, error: 'An error occurred while generating your meditation. Please try again later.' };
    }
  }

  // ... rest of the component code
</script>

<div class="meditation-container">
  <h1>New Meditation</h1>

  <form
    method="POST"
    action="?/generateMeditation"
    use:enhance={() => {
      return async ({ result }) => {
        isGenerating = false;
        if (result.type === 'success' && result.data.success) {
          const meditationId = result.data.meditation_id;
          pollMeditationStatus(meditationId);
        }
      };
    }}
  >
    <div class="duration-slider">
      <label for="duration">Duration: <span id="duration-value">{duration}</span> minutes</label>
      <input type="range" id="duration" name="duration" min="1" max="30" bind:value={duration} />
    </div>
    <button type="submit" class="generate-btn" disabled={isGenerating}>
      <i class="fas fa-paper-plane"></i>
      <span>Generate Meditation</span>
    </button>
  </form>

  {#if isGenerating}
    <div class="generating-message">
      <p><i class="fas fa-spinner fa-spin"></i> &nbsp; Generating your meditation...</p>
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
    background: #4CAF50;
    cursor: pointer;
    border-radius: 50%;
  }

  .duration-slider input::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #4CAF50;
    cursor: pointer;
    border-radius: 50%;
  }

  .generate-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background-color: #4CAF50;
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
    background-color: #45a049;
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