<script lang="ts">
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import { profileSetupStore, updateProfileSetupStore, resetProfileSetupStore } from '$lib/stores/profileSetup';
  import { goto } from '$app/navigation';
  import type { ProfileSetup } from '$lib/stores/profileSetup';
  import { transition } from '$lib/stores/transition';

  let currentQuestion = 0;
  let errorMessage = '';

  type Question = {
    question: string;
    options: Array<{ display: string; value: string }>;
    key: keyof ProfileSetup;
    multiple: boolean;
  };

  const questions: Question[] = [
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

  onMount(() => {
    resetProfileSetupStore();
    
    // Push initial state
    history.pushState({ question: currentQuestion }, '');

    // Listen for popstate events
    window.addEventListener('popstate', handlePopState);

    return () => {
      // Clean up the event listener when the component is destroyed
      window.removeEventListener('popstate', handlePopState);
    };
  });

  function handlePopState(event: PopStateEvent) {
    if (event.state && typeof event.state.question === 'number') {
      currentQuestion = event.state.question;
      transition.setVisible(true);
      transition.fadeIn();
    }
  }

  function updateStore(key: keyof ProfileSetup, value: string) {
    updateProfileSetupStore(key, value);
  }

  function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        currentQuestion++;
        history.pushState({ question: currentQuestion }, '');
        transition.setVisible(true);
        transition.fadeIn();
      }, 700); // 500ms pause before fade-in starts
    } else {
      submitForm();
    }
  }

  function prevQuestion() {
    if (currentQuestion > 0) {
      history.back();
    }
  }

  async function submitForm() {
    const formElement = document.querySelector('form');
    if (!formElement) {
      errorMessage = 'Form not found';
      return;
    }
    const response = await fetch('?/submit', {
      method: 'POST',
      body: new FormData(formElement as HTMLFormElement),
    });
    const result = await response.json();
    if (result.type === 'success') {
      goto('/meditation'); 
    } else {
      errorMessage = 'An error occurred while saving your profile. Please try again.';
    }
  }

  function handleOptionClick(key: keyof ProfileSetup, value: string) {
    if ($profileSetupStore[key] === value) {
      // Important: This handles the case where a user selects the same option again
      // It allows progression to the next question even if the value hasn't changed
      if (!questions[currentQuestion].multiple) {
        if (currentQuestion === questions.length - 1) {
          setTimeout(() => submitForm(), 600);
        } else {
          nextQuestion();
        }
      }
    }
  }

  function handleOptionChange(key: keyof ProfileSetup, value: string) {
    updateStore(key, value);
    // Important: This progresses to the next question automatically
    // when a new option is selected for non-multiple choice questions
    if (!questions[currentQuestion].multiple) {
      if (currentQuestion === questions.length - 1) {
        setTimeout(() => submitForm(), 600);
      } else {
        nextQuestion();
      }
    }
  }
</script>

<div class="profile-setup">
  <form method="POST" use:enhance>
    {#each questions as q}
      <!-- Important: These hidden inputs ensure all question responses are submitted,
           even if the user navigates back and forth between questions -->
      <input type="hidden" name={q.key} value={$profileSetupStore[q.key] || ''}>
    {/each}
    <div class="form-content">
      <div class="form-container">
        {#if $transition.visible}
          <div class="question" style="opacity: {$transition.opacity}; transition: opacity 0.15s ease;">
            <h3>{questions[currentQuestion].question}</h3>
            <div class="options-grid">
              {#each questions[currentQuestion].options as option}
                <label class="option-label">
                  <input
                    type={questions[currentQuestion].multiple ? "checkbox" : "radio"}
                    name={questions[currentQuestion].key}
                    value={option.value}
                    checked={$profileSetupStore[questions[currentQuestion].key] === option.value}
                    on:click={() => handleOptionClick(questions[currentQuestion].key, option.value)}
                    on:change={() => handleOptionChange(questions[currentQuestion].key, option.value)}
                  >
                  <span class="option-text">{option.display}</span>
                </label>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>

    {#if $transition.visible}
      <div class="navigation" style="opacity: {$transition.opacity}; transition: opacity 0.15s ease;">
        <div class="nav-left">
          {#if currentQuestion > 0}
            <button type="button" class="back-link" on:click={prevQuestion}>Back</button>
          {/if}
        </div>
        <div class="nav-right">
          <div class="question-counter">{currentQuestion + 1}/{questions.length}</div>
          {#if questions[currentQuestion].multiple}
            <button type="button" class="btn primary" on:click={nextQuestion}>
              {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
            </button>
          {/if}
        </div>
      </div>
    {/if}
  </form>
</div>

{#if errorMessage}
  <div class="error-message">
    {errorMessage}
  </div>
{/if}

<style>
  .profile-setup {
    display: flex;
    flex-direction: column;
    justify-content: center;
    /* min-height: 100vh; */
    padding: 2rem;
    box-sizing: border-box;
    position: relative;
  }

  .form-content {
    position: relative;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }

  .form-container {
    width: 100%;
    min-height: 300px;
  }

  .question {
    text-align: center;
    margin-bottom: 2.5rem;
    transition: opacity 0.15s ease;
  }

  h3 {
    font-family: 'Roboto', sans-serif;
    font-weight: 600;
    color: #333;
    margin-bottom: 2rem;
    font-size: 1.5rem!important;
  }

  .options-grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }


  input[type="radio"],
  input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .option-label input:checked {
    background-color: black;
  }

  .option-text {
    color: #333;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;
    padding: 1rem 0;
    margin-bottom: 0.5rem;
    cursor: pointer;
    border: 2px solid black;
    border-radius: 8px;
  }

  /* Hover effect only for non-touch devices */
  @media (hover: hover) {
    .option-text:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }

  .option-label input:checked + .option-text {
    color: white;
    background-color: black;
  }

  .navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2rem;
    width: 100%;
    transition: opacity 0.15s ease;
  }

  .nav-left, .nav-right {
    display: flex;
    align-items: center;
  }

  .nav-right {
    justify-content: flex-end;
  }

  .question-counter {
    font-size: 1rem;
    color: #666;
  }

  .back-link {
    background: none;
    border: none;
    color: #000000;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
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
    border: 1px solid #4a90e2;
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
      /* min-height: 100vh; */
      justify-content: flex-start;
    }

    .form-content {
      margin-top: 1rem;
      margin-bottom: 1rem;
    }

    .form-container {
      min-height: auto;
    }

    h3 {
      font-family: 'Roboto', sans-serif;
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }

    .options-grid {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .option-label {
      margin-bottom: 0.25rem;
    }

    .navigation {
      margin-top: 1rem;
      padding-bottom: 1rem;
    }

    .btn {
      padding: 0.5rem 1rem;
    }
  }
</style>