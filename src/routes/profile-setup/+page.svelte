<script lang="ts">
  import { enhance } from '$app/forms';
  import { profileSetupStore, updateProfileSetupStore } from '$lib/stores/profileSetup';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  export let data;

  let currentStep = 0;
  let steps = ['Personal Information', 'Experience', 'Questionnaire'];
  let currentQuestion = 0;

  let formElement: HTMLFormElement;
  let errorMessage = '';

  let experiences = ['beginner', 'intermediate', 'advanced'];

  let questions = [
    {
      question: "What is your primary goal for using this app?",
      options: ["Reduce stress and anxiety", "Improve sleep quality", "Enhance focus and concentration", "Boost overall mood and emotional well-being", "Other"],
      field: "primaryGoal"
    },
    {
      question: "What are your biggest challenges related to stress and well-being?",
      options: ["Difficulty managing daily stress", "Trouble falling asleep or staying asleep", "Struggling with focus and concentration", "Experiencing low mood or negative emotions", "Other"],
      field: "challenges"
    },
    {
      question: "What time of day do you typically have the most time and energy to dedicate to self-care?",
      options: ["Morning", "Afternoon", "Evening", "Night", "Varies depending on the day"],
      field: "bestTime"
    },
    {
      question: "What type of audio experience do you find most calming and relaxing?",
      options: ["Gentle female voice with nature sounds", "Calm male voice with instrumental music", "Gender-neutral voice with white noise", "No voice, only nature sounds or ambient music", "Other"],
      field: "audioPreference"
    },
    {
      question: "What are your goals for self-improvement?",
      options: ["Increase self-confidence and assertiveness", "Improve communication and interpersonal skills", "Develop better emotional regulation", "Learn stress management techniques", "Explore mindfulness and meditation practices", "Enhance creativity and artistic expression", "Other"],
      field: "selfImprovementGoals"
    }
  ];

  $: totalSteps = steps.length + questions.length - 1;
  $: progress = calculateProgress();

  $: {
    if (browser) {
      console.log('Current step:', currentStep);
      console.log('Current question:', currentQuestion);
      console.log('Progress:', progress);
      console.log('Profile store:', $profileSetupStore);
    }
  }

  function calculateProgress() {
    const baseProgress = (currentStep / steps.length) * 100;
    if (currentStep < 2) {
      return baseProgress;
    } else {
      const answeredQuestions = Object.values($profileSetupStore.preferences).filter(v => v && (Array.isArray(v) ? v.length > 0 : v !== '')).length;
      const questionProgress = (answeredQuestions / questions.length) * (100 / steps.length);
      const calculatedProgress = baseProgress + questionProgress;
      if (browser) console.log('Calculated progress:', calculatedProgress, 'Answered questions:', answeredQuestions);
      return calculatedProgress;
    }
  }

  function nextStep() {
    if (currentStep < 2) {
      currentStep++;
      currentQuestion = 0;
    } else if (currentQuestion < questions.length - 1) {
      currentQuestion++;
    } else if (currentStep === 2 && currentQuestion === questions.length - 1) {
      // This is the last question, prepare for submission
      currentStep++;
    }
    if (browser) console.log('Next step:', currentStep, 'Current question:', currentQuestion);
  }

  function prevStep() {
    if (currentStep === 3) {
      // If we're at the submission step, go back to the last question
      currentStep = 2;
      currentQuestion = questions.length - 1;
    } else if (currentQuestion > 0) {
      currentQuestion--;
    } else if (currentStep > 0) {
      currentStep--;
      currentQuestion = 0;
    }
    if (browser) console.log('Prev step:', currentStep, 'Current question:', currentQuestion);
  }

  function updateStore(field: string, value: any) {
    if (browser) console.log('Updating store:', field, value);
    updateProfileSetupStore(field, value);
    progress = calculateProgress(); // Recalculate progress after updating the store
  }

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

  <div class="progress-bar">
    <div class="progress" style="width: {progress}%"></div>
  </div>
  <div class="step-text">{steps[currentStep]}{currentStep === 2 ? ` - Question ${currentQuestion + 1}/${questions.length}` : ''}</div>

  <form method="POST" action="?/submitProfile" use:enhance={handleSubmit} bind:this={formElement}>
    <input type="hidden" name="name" />
    <input type="hidden" name="dob" />
    <input type="hidden" name="gender" />
    <input type="hidden" name="experience" />
    <input type="hidden" name="preferences" />

    <div class="form-container">
      {#if currentStep === 0}
        <h2>Personal Information</h2>
        <div class="form-group">
          <label for="name">Name:</label>
          <input type="text" id="name" bind:value={$profileSetupStore.name} on:input={() => updateStore('name', $profileSetupStore.name)} required>
        </div>
        <div class="form-group">
          <label for="dob">Date of Birth:</label>
          <input type="date" id="dob" bind:value={$profileSetupStore.dob} on:input={() => updateStore('dob', $profileSetupStore.dob)} required>
        </div>
        <div class="form-group">
          <label for="gender">Gender:</label>
          <input type="text" id="gender" bind:value={$profileSetupStore.gender} on:input={() => updateStore('gender', $profileSetupStore.gender)} required>
        </div>
      {:else if currentStep === 1}
        <h2>Experience Level</h2>
        {#each experiences as exp}
          <label class="radio-label">
            <input type="radio" name="experience" value={exp} checked={$profileSetupStore.experience === exp} on:change={() => updateStore('experience', exp)}>
            <span class="radio-text">{exp.charAt(0).toUpperCase() + exp.slice(1)}</span>
          </label>
        {/each}
      {:else if currentStep === 2}
        <h2>Questionnaire</h2>
        {#if currentQuestion < questions.length}
          {@const q = questions[currentQuestion]}
          <div class="question">
            <h3>{q.question}</h3>
            {#each q.options as option}
              <label class="option-label">
                <input
                  type={q.field === 'challenges' || q.field === 'selfImprovementGoals' ? "checkbox" : "radio"}
                  name={q.field}
                  value={option}
                  checked={Array.isArray($profileSetupStore.preferences[q.field])
                    ? $profileSetupStore.preferences[q.field].includes(option)
                    : $profileSetupStore.preferences[q.field] === option}
                  on:change={() => {
                    let newValue;
                    if (q.field === 'challenges' || q.field === 'selfImprovementGoals') {
                      newValue = $profileSetupStore.preferences[q.field].includes(option)
                        ? $profileSetupStore.preferences[q.field].filter(v => v !== option)
                        : [...($profileSetupStore.preferences[q.field] || []), option];
                    } else {
                      newValue = option;
                    }
                    updateStore(`preferences.${q.field}`, newValue);
                  }}
                >
                <span class="option-text">{option}</span>
              </label>
            {/each}
          </div>
        {/if}
      {/if}
    </div>

    <div class="navigation">
      {#if currentStep > 0 || currentQuestion > 0}
        <button type="button" class="btn secondary" on:click={prevStep}>Previous</button>
      {/if}
      
      {#if currentStep < 2 || (currentStep === 2 && currentQuestion < questions.length - 1)}
        <button type="button" class="btn primary" on:click={nextStep}>Next</button>
      {:else if currentStep === 2 && currentQuestion === questions.length - 1}
        <button type="button" class="btn primary" on:click={nextStep}>Review</button>
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
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 0;
  }

  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 2rem;
    font-size: 2.5rem;
    font-weight: 300;
  }

  h2 {
    color: #444;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
    font-weight: 300;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background-color: #e0e0e0;
    margin-bottom: 1.5rem;
  }

  .progress {
    height: 100%;
    background-color: #4a90e2;
    transition: width 0.3s ease;
  }

  .step-text {
    text-align: center;
    color: #666;
    margin-bottom: 2rem;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .form-group {
    margin-bottom: 2rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #555;
    font-size: 1rem;
  }

  input[type="text"],
  input[type="date"] {
    width: 100%;
    padding: 0.75rem 0;
    border: none;
    border-bottom: 2px solid #ddd;
    font-size: 1rem;
    background-color: transparent;
    transition: border-color 0.3s ease;
  }

  input[type="text"]:focus,
  input[type="date"]:focus {
    outline: none;
    border-bottom-color: #4a90e2;
  }

  .radio-label,
  .option-label {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    cursor: pointer;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    transition: all 0.3s ease;
    position: relative;
  }

  .radio-label:hover,
  .option-label:hover {
    border-color: #4a90e2;
  }

  input[type="radio"],
  input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  input[type="radio"]:checked + .option-text,
  input[type="checkbox"]:checked + .option-text {
    color: #4a90e2;
  }

  input[type="radio"]:checked + .option-text::after,
  input[type="checkbox"]:checked + .option-text::after {
    content: '✓';
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #4a90e2;
    font-size: 1.2rem;
  }

  input[type="radio"]:checked ~ .option-label,
  input[type="checkbox"]:checked ~ .option-label {
    background-color: #e6f3ff;
    border-color: #4a90e2;
  }

  .option-text {
    color: #333;
    font-size: 1rem;
    display: flex;
    align-items: center;
    width: 100%;
  }

  .question {
    margin-bottom: 2.5rem;
  }

  h3 {
    font-weight: 400;
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }

  .navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s ease, transform 0.1s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .btn:active {
    transform: translateY(1px);
  }

  .btn.primary {
    background-color: #4a90e2;
    color: white;
  }

  .btn.secondary {
    background-color: transparent;
    color: #4a90e2;
  }

  .btn:hover {
    opacity: 0.9;
  }

  .error-message {
    color: #d32f2f;
    text-align: center;
    margin-top: 1rem;
    font-size: 0.9rem;
  }

  @media (max-width: 600px) {
    .profile-setup {
      padding: 1rem;
    }

    h1 {
      font-size: 2rem;
    }

    .form-group input,
    .form-group select {
      width: 100%;
    }
  }
</style>