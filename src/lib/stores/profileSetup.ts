import { writable } from 'svelte/store';

export const profileSetupStore = writable({
  name: '',
  dob: '',
  gender: '',
  experience: '',
  preferences: {
    primaryGoal: '',
    challenges: [],
    bestTime: '',
    audioPreference: '',
    selfImprovementGoals: []
  }
});