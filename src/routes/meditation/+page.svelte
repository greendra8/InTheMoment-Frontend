<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { ActionData } from './$types';

  export let form: ActionData;

  let isGenerating = false;
</script>

<div class="meditation-container">
  <h1>Generate New Meditation</h1>

  <form
    method="POST"
    action="?/generateMeditation"
    use:enhance={() => {
      isGenerating = true;
      return async ({ result }) => {
        isGenerating = false;
        if (result.type === 'success' && result.data.success) {
          goto('/dashboard');
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