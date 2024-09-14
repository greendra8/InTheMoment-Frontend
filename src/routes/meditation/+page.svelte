<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { subscribeMeditationStatus } from '$lib/supabase';
  import type { ActionData, PageData } from './$types';
  import { onDestroy } from 'svelte';
  import { spring } from 'svelte/motion';

  export let form: ActionData;
  export let data: PageData;

  let isGenerating = false;
  let duration = 5;
  let generationStatus = '';
  let buttonDisabled = false;
  let unsubscribe: (() => void) | null = null;
  let currentMeditationId: string | null = null;  // New variable to store the current meditation ID

  let stanceOptions = [
    { value: 'The user is sitting down during this session', display: 'Sitting', icon: 'fa-chair' },
    { value: 'The user is lying down during this session', display: 'Lying Down', icon: 'fa-bed' },
    { value: 'The user is on a walk during this session', display: 'Walking', icon: 'fa-walking' }
  ];
  let eyesOptions = [
    { value: 'The user wants to keep their eyes open during this session', display: 'Open', icon: 'fa-eye' },
    { value: 'The user wants to have their eyes closed during this session', display: 'Closed', icon: 'fa-eye-slash' }
  ];
  let selectedStance = stanceOptions[0].value;
  let selectedEyes = eyesOptions[1].value;

  let stanceSpring = spring(0);
  let eyesSpring = spring(0);

  $: stanceSpring.set(stanceOptions.findIndex(option => option.value === selectedStance));
  $: eyesSpring.set(eyesOptions.findIndex(option => option.value === selectedEyes));

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

  function createParametersJSON() {
    return {
      stance: [selectedStance],
      eyes: [selectedEyes]
    };
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

  <div class="options-container">
    <div class="option-group">
      <h3>Stance</h3>
      <div class="sliding-checkbox" style="--option-count: {stanceOptions.length};">
        <div class="slider-background" style="transform: translateX({100 * $stanceSpring}%)"></div>
        {#each stanceOptions as stance, i}
          <label class="option">
            <input
              type="radio"
              name="stance"
              value={stance.value}
              bind:group={selectedStance}
              hidden
            >
            <i class="fas {stance.icon}"></i>
            <span>{stance.display}</span>
          </label>
        {/each}
      </div>
    </div>
    <div class="option-group">
      <h3>Eyes</h3>
      <div class="sliding-checkbox" style="--option-count: {eyesOptions.length};">
        <div class="slider-background" style="transform: translateX({100 * $eyesSpring}%)"></div>
        {#each eyesOptions as eye, i}
          <label class="option">
            <input
              type="radio"
              name="eyes"
              value={eye.value}
              bind:group={selectedEyes}
              hidden
            >
            <i class="fas {eye.icon}"></i>
            <span>{eye.display}</span>
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
        min="1" 
        max="30" 
        bind:value={duration} 
      />
      <div class="slider-progress" style="width: {(duration - 1) / 29 * 100}%"></div>
      <div class="slider-thumb" style="left: calc({(duration - 1) / 29 * 100}% - 10px)"></div>
    </div>
  </div>

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
    <input type="hidden" name="userLocalTime" value={getUserLocalTime()} />
    <input type="hidden" name="parameters" value={JSON.stringify(createParametersJSON())} />
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
    background-color: #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
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
    transition: color 0.3s ease;
    position: relative;
    z-index: 1;
    color: #333;
  }

  .option i {
    display: block;
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

  .option span {
    font-size: 0.8rem;
  }

  input[type="radio"]:checked + i,
  input[type="radio"]:checked + i + span {
    color: white;
  }
</style>