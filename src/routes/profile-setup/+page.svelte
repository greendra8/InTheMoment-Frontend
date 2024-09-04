<script lang="ts">
  import { enhance } from '$app/forms';
  import { profileSetupStore } from '$lib/stores/profileSetup';
  import PersonalInfo from './PersonalInfo.svelte';
  import Experience from './Experience.svelte';
  import Questionnaire from './Questionnaire.svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  export let data;

  let currentStep = 0;
  let steps = ['Personal Information', 'Experience', 'Questionnaire'];

  function nextStep() {
    if (currentStep < steps.length - 1) {
      currentStep++;
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
    }
  }

  let errorMessage = '';

  let formElement: HTMLFormElement;

  onMount(() => {
    profileSetupStore.subscribe(($store) => {
      if (formElement) {
        formElement.name.value = $store.name;
        formElement.dob.value = $store.dob;
        formElement.gender.value = $store.gender;
        formElement.experience.value = $store.experience;
        formElement.preferences.value = JSON.stringify($store.preferences);
      }
    });
  });

  function handleSubmit(event) {
    return async ({ result }) => {
      if (result.type === 'success') {
        goto('/dashboard');
      } else {
        errorMessage = 'An error occurred while saving your profile. Please try again.';
      }
    };
  }
</script>

<div class="profile-setup">
  <h1>Profile Setup</h1>

  <div class="step-indicator">
    {#each steps as step, index}
      <div class={`step ${currentStep === index ? 'active' : ''}`}>
        <span class="step-number">{index + 1}</span>
        <span class="step-text">{step}</span>
      </div>
    {/each}
  </div>

  <form method="POST" action="?/submitProfile" use:enhance={handleSubmit} bind:this={formElement}>
    <input type="hidden" name="name" />
    <input type="hidden" name="dob" />
    <input type="hidden" name="gender" />
    <input type="hidden" name="experience" />
    <input type="hidden" name="preferences" />

    <div class="form-container">
      {#if currentStep === 0}
        <PersonalInfo />
      {:else if currentStep === 1}
        <Experience />
      {:else if currentStep === 2}
        <Questionnaire />
      {/if}
    </div>

    <div class="navigation">
      {#if currentStep > 0}
        <button type="button" class="btn secondary" on:click={prevStep}>Previous</button>
      {/if}
      
      {#if currentStep < steps.length - 1}
        <button type="button" class="btn primary" on:click={nextStep}>Next</button>
      {:else}
        <button type="submit" class="btn primary">Submit</button>
      {/if}
    </div>
  </form>
</div>

{#if errorMessage}
  <div class="error-message">
    {errorMessage}
  </div>
{/if}

<style>
  .profile-setup {
    max-width: 100%;
    margin: 0 auto;
    padding: 1rem;
  }

  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  .step-indicator {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .step {
    flex: 1;
    text-align: center;
    padding: 0.5rem;
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 0.25rem;
  }

  .step-number {
    color: #333;
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.25rem;
    border: 1px solid #333;
  }

  .step.active .step-number {
    background-color: #4a90e2;
    color: white;
    border-color: #4a90e2;
  }

  .navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 1.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s ease;
    width: 48%;
  }

  .btn.primary {
    background-color: #4a90e2;
    color: white;
  }

  .btn.secondary {
    background-color: #f0f0f0;
    color: #333;
  }

  .btn:hover {
    opacity: 0.9;
  }

  @media (max-width: 480px) {
    .step-text {
      display: none;
    }

    .step {
      padding: 0.25rem;
    }

    .btn {
      font-size: 0.9rem;
      padding: 0.5rem;
    }
  }

  .error-message {
    color: #d32f2f;
    text-align: center;
    margin-top: 1rem;
    font-size: 0.9rem;
  }
</style>