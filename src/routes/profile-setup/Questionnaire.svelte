<script lang="ts">
  import { profileSetupStore } from '$lib/stores/profileSetup';
  import { onMount } from 'svelte';

  export let setTotalQuestions: (count: number) => void;
  export let updateAnsweredQuestions: (count: number) => void;

  let questions = [
    {
      question: "What is your primary goal for using this app?",
      options: [
        "Reduce stress and anxiety",
        "Improve sleep quality",
        "Enhance focus and concentration",
        "Boost overall mood and emotional well-being",
        "Other"
      ],
      field: "primaryGoal"
    },
    {
      question: "What are your biggest challenges related to stress and well-being?",
      options: [
        "Difficulty managing daily stress",
        "Trouble falling asleep or staying asleep",
        "Struggling with focus and concentration",
        "Experiencing low mood or negative emotions",
        "Other"
      ],
      field: "challenges"
    },
    {
      question: "What time of day do you typically have the most time and energy to dedicate to self-care?",
      options: [
        "Morning",
        "Afternoon",
        "Evening",
        "Night",
        "Varies depending on the day"
      ],
      field: "bestTime"
    },
    {
      question: "What type of audio experience do you find most calming and relaxing?",
      options: [
        "Gentle female voice with nature sounds",
        "Calm male voice with instrumental music",
        "Gender-neutral voice with white noise",
        "No voice, only nature sounds or ambient music",
        "Other"
      ],
      field: "audioPreference"
    },
    {
      question: "What are your goals for self-improvement?",
      options: [
        "Increase self-confidence and assertiveness",
        "Improve communication and interpersonal skills",
        "Develop better emotional regulation",
        "Learn stress management techniques",
        "Explore mindfulness and meditation practices",
        "Enhance creativity and artistic expression",
        "Other"
      ],
      field: "selfImprovementGoals"
    }
  ];

  let answeredQuestions = new Set();

  onMount(() => {
    setTotalQuestions(questions.length);
    // Initialize answered questions based on existing preferences
    questions.forEach(q => {
      if ($profileSetupStore.preferences[q.field]) {
        answeredQuestions.add(q.field);
      }
    });
    updateAnsweredQuestions(answeredQuestions.size);
  });

  function updatePreference(field: string, value: string | string[]) {
    profileSetupStore.update(store => ({
      ...store,
      preferences: {
        ...store.preferences,
        [field]: value
      }
    }));
    
    if (value && (typeof value === 'string' || value.length > 0)) {
      answeredQuestions.add(field);
    } else {
      answeredQuestions.delete(field);
    }
    updateAnsweredQuestions(answeredQuestions.size);
  }
</script>

<h2>Questionnaire</h2>

<form>
  {#each questions as q, index}
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
              if (q.field === 'challenges' || q.field === 'selfImprovementGoals') {
                let newValue = $profileSetupStore.preferences[q.field].includes(option)
                  ? $profileSetupStore.preferences[q.field].filter(v => v !== option)
                  : [...$profileSetupStore.preferences[q.field], option];
                updatePreference(q.field, newValue);
              } else {
                updatePreference(q.field, option);
              }
            }}
          >
          <span class="option-text">{option}</span>
        </label>
      {/each}
    </div>
  {/each}
</form>

<style>
  h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }

  .question {
    margin-bottom: 1.5rem;
  }

  h3 {
    font-weight: bold;
    color: #333;
    margin-bottom: 0.75rem;
    font-size: 1rem;
  }

  .option-label {
    display: block;
    margin-bottom: 0.5rem;
    cursor: pointer;
  }

  input[type="checkbox"],
  input[type="radio"] {
    margin-right: 0.5rem;
  }

  .option-text {
    color: #555;
    font-size: 0.9rem;
  }
</style>