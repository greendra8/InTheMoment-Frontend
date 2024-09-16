<script lang="ts">
  import { enhance } from '$app/forms';
  import { profileSetupStore, updateProfileSetupStore } from '$lib/stores/profileSetup';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  export let data;

  let currentQuestion = 0;
  let errorMessage = '';

  const questions = [
    {
      question: "What's your main goal for meditating?",
      options: [
        { display: "Reduce stress", value: "User seeks to alleviate stress and tension in their life." },
        { display: "Improve sleep", value: "User aims to enhance their sleep quality and patterns." },
        { display: "Increase focus", value: "User wants to improve their concentration and attention span." },
        { display: "Emotional balance", value: "User desires better control and understanding of their emotions." },
        { display: "Personal growth", value: "User is interested in self-improvement and inner development." },
        { display: "I'm not sure yet", value: "User is new to meditation and exploring its benefits." }
      ],
      key: "meditationGoal",
      multiple: false
    },
    {
      question: "How would you describe your current stress level?",
      options: [
        { display: "Generally relaxed", value: "User experiences low levels of stress in their daily life." },
        { display: "Occasionally stressed", value: "User faces moderate stress levels from time to time." },
        { display: "Frequently overwhelmed", value: "User often experiences high levels of stress and feels overwhelmed." },
        { display: "I'm not sure", value: "User is uncertain about their stress levels or how to categorise them." }
      ],
      key: "stressLevel",
      multiple: false
    },
    {
      question: "Which best describes your sleep?",
      options: [
        { display: "Fall asleep easily, wake up refreshed", value: "User has a healthy sleep pattern with no significant issues." },
        { display: "Trouble falling asleep", value: "User struggles with initiating sleep at bedtime." },
        { display: "Wake up frequently during the night", value: "User experiences interrupted sleep and difficulty staying asleep." },
        { display: "Wake up feeling unrefreshed", value: "User's sleep quality is poor, leading to fatigue upon waking." },
        { display: "I'm not sure", value: "User is uncertain about their sleep patterns or quality." }
      ],
      key: "sleepPattern",
      multiple: false
    },
    {
      question: "How long can you typically focus on one task without getting distracted?",
      options: [
        { display: "Less than 5 minutes", value: "User has a very short attention span and gets distracted easily." },
        { display: "5-15 minutes", value: "User can maintain focus for short periods but struggles with longer durations." },
        { display: "15-30 minutes", value: "User has a moderate attention span suitable for many tasks." },
        { display: "More than 30 minutes", value: "User can sustain focus for extended periods without significant distraction." },
        { display: "I haven't really noticed", value: "User is unaware of their typical focus duration." }
      ],
      key: "focusDuration",
      multiple: false
    },
    {
      question: "How would you describe your typical mental state throughout the day?",
      options: [
        { display: "Calm and centred", value: "User generally maintains a balanced and peaceful state of mind." },
        { display: "Anxious or worried", value: "User often experiences anxiety or excessive worry in their daily life." },
        { display: "Distracted or scattered", value: "User frequently feels unfocused and has difficulty concentrating." },
        { display: "Tired or low energy", value: "User commonly experiences fatigue or lack of energy throughout the day." },
        { display: "It varies greatly day to day", value: "User's mental state is highly variable and inconsistent." }
      ],
      key: "mentalState",
      multiple: false
    },
    {
      question: "How would you characterise your daily technology use?",
      options: [
        { display: "Minimal - I use tech only when necessary", value: "User has limited engagement with technology in their daily life." },
        { display: "Moderate - I balance tech use with offline activities", value: "User maintains a healthy balance between technology use and other activities." },
        { display: "Heavy - I'm connected most of the day", value: "User spends a significant portion of their day engaged with technology." },
        { display: "Constant - I feel anxious when not connected", value: "User has a strong dependency on technology and feels uneasy without it." },
        { display: "I'm not sure how to categorise my usage", value: "User is uncertain about their technology usage patterns." }
      ],
      key: "techUsage",
      multiple: false
    }
  ];

  $: progress = ((currentQuestion + 1) / questions.length) * 100;

  function updateStore(key: keyof ProfileSetup, value: string) {
    updateProfileSetupStore(key, value);
  }

  function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
    }
  }

  function prevQuestion() {
    if (currentQuestion > 0) {
      currentQuestion--;
    }
  }

  function handleSubmit(event: Event) {
    return async ({ result }) => {
      if (result.type === 'success') {
        goto('/dashboard');
      } else {
        errorMessage = 'An error occurred while saving your profile. Please try again.';
      }
    };
  }
</script>

<form method="POST" use:enhance={handleSubmit}>
  {#each questions as q}
    <input type="hidden" name={q.key} value={$profileSetupStore[q.key]}>
  {/each}
  <div class="form-container">
    {#if currentQuestion < questions.length}
      {@const q = questions[currentQuestion]}
      <div class="question">
        <h3>{q.question}</h3>
        {#each q.options as option}
          <label class="option-label">
            <input
              type={q.multiple ? "checkbox" : "radio"}
              name={q.key}
              value={option.value}
              checked={$profileSetupStore[q.key] === option.value}
              on:change={() => updateStore(q.key, option.value)}
            >
            <span class="option-text">{option.display}</span>
          </label>
        {/each}
      </div>
    {/if}
  </div>

  <div class="navigation">
    {#if currentQuestion > 0}
      <button type="button" class="btn secondary" on:click={prevQuestion}>Previous</button>
    {/if}
    
    {#if currentQuestion < questions.length - 1}
      <button type="button" class="btn primary" on:click={nextQuestion}>Next</button>
    {:else}
      <button type="submit" class="btn primary">Submit</button>
    {/if}
  </div>
</form>

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