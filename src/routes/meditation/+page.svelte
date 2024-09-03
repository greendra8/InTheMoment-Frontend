<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { getMeditationStatus } from '$lib/supabase';
  import type { ActionData, PageData } from './$types';

  export let form: ActionData;
  export let data: PageData;

  let isGenerating = false;
  let retryCount = 0;

  async function pollMeditationStatus(meditationId: string) {
    try {
      const result = await getMeditationStatus(meditationId);
      
      if (result.status === 'completed') {
        goto(`/meditation/${meditationId}`);
      } else if (result.status === 'processing') {
        isGenerating = true;
        setTimeout(() => pollMeditationStatus(meditationId), 5000); // Poll every 5 seconds
      } else {
        console.log('Error status:', result.status);
        if (retryCount < 3) {
          retryCount++;
          setTimeout(() => pollMeditationStatus(meditationId), 5000);
        } else {
          isGenerating = false;
          form = { success: false, error: 'An error occurred while generating your meditation. Please try again later.' };
        }
      }
    } catch (error) {
      console.error('Error polling meditation status:', error);
      isGenerating = false;
      form = { success: false, error: 'An error occurred while checking meditation status. Please try again later.' };
    }
  }

  // ... rest of the component code
</script>

<div class="meditation-container">
  <h1>Generate New Meditation</h1>

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
    <div class="duration-options">
      <button type="submit" name="duration" value="5" disabled={isGenerating}>
        5 Minutes
      </button>
      <button type="submit" name="duration" value="15" disabled={isGenerating}>
        15 Minutes
      </button>
      <button type="submit" name="duration" value="25" disabled={isGenerating}>
        25 Minutes
      </button>
    </div>
  </form>

  {#if isGenerating}
    <p class="generating-message">Generating your meditation...</p>
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

  .duration-options {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2rem;
  }

  button {
    flex: 1;
    margin: 0 0.5rem;
    padding: 1rem;
    font-size: 1rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  button:hover {
    background-color: #45a049;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
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