<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  export let sessionId: string;
  export let profileId: string;
  export let existingFeedback: string | null = null;

  let feedbackText = '';
  let initialFeedback = '';
  const dispatch = createEventDispatcher();

  $: isSubmitDisabled = feedbackText === initialFeedback;

  onMount(() => {
    feedbackText = existingFeedback || '';
    initialFeedback = feedbackText;
  });

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

  function handleClose() {
    dispatch('close');
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <div class="form-header">
    <h3>Your Feedback</h3>
    <button type="button" class="close-button" on:click={handleClose}>
      <i class="fas fa-times"></i>
    </button>
  </div>
  <textarea
    bind:value={feedbackText}
    placeholder="Enter your feedback here..."
    rows="4"
    maxlength="500"
    on:focus={handleFocus}
    on:blur={handleBlur}
  ></textarea>
  <div class="button-container">
    <button type="submit" disabled={isSubmitDisabled}>Send Feedback</button>
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

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    color: #333;
    padding: 3px 6px 0;
    margin-top: -5px;
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
    font-family: 'Lato', sans-serif;
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
    background-color: #ffffff;
    color: #333;
    border: 1px solid #cacaca;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.3s ease, opacity 0.3s ease;
    font-size: 1rem;
    font-weight: 500;
  }

  button:hover:not(:disabled) {
    background-color: #ffffff;
  }

  button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>