<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let sessionId: string;
  export let profileId: string;
  export let existingFeedback: string | null = null;

  let feedbackText = existingFeedback || '';
  let initialFeedback = feedbackText;
  const dispatch = createEventDispatcher();

  $: isSubmitDisabled = feedbackText === initialFeedback;

  console.log('FeedbackForm component initialized:', { sessionId, profileId, existingFeedback });

  function handleSubmit() {
    console.log('Submitting feedback:', feedbackText);
    dispatch('submit', { sessionId, profileId, feedback: feedbackText });
    initialFeedback = feedbackText;
  }

  function handleFocus() {
    dispatch('focus');
  }

  function handleBlur() {
    dispatch('blur');
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <textarea
    bind:value={feedbackText}
    placeholder="Enter your feedback here..."
    rows="4"
    maxlength="500"
    on:focus={handleFocus}
    on:blur={handleBlur}
  ></textarea>
  <div class="button-container">
    <button type="submit" disabled={isSubmitDisabled}>Submit Feedback</button>
  </div>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    resize: vertical;
    background-color: #ffffff;
    color: #333;
    box-sizing: border-box;
    font-size: 1rem;
    line-height: 1.5;
    transition: border-color 0.3s ease;
    min-height: 100px;
  }

  textarea:focus {
    outline: none;
    border-color: #9e9e9e;
  }

  .button-container {
    display: flex;
    justify-content: flex-end;
  }

  button {
    padding: 0.75rem 1.5rem;
    background-color: #f0f0f0;
    color: #333;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease, opacity 0.3s ease;
    font-size: 1rem;
    font-weight: 500;
  }

  button:hover:not(:disabled) {
    background-color: #e0e0e0;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>