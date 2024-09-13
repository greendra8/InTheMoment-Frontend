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
    border-radius: 8px;
    width: 100%; /* Ensure the form takes full width of its container */
    box-sizing: border-box; /* Include padding in the width calculation */
  }

  textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
    background-color: #ffffff;
    color: #333;
    box-sizing: border-box; /* Include padding and border in the width calculation */
  }

  .button-container {
    display: flex;
    justify-content: flex-end;
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #333;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease, opacity 0.3s ease;
  }

  button:hover:not(:disabled) {
    background-color: #555;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>