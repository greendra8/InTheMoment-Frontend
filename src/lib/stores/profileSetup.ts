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

export function updateProfileSetupStore(field: string, value: any) {
  profileSetupStore.update(store => {
    if (field.startsWith('preferences.')) {
      const preferenceField = field.split('.')[1];
      return {
        ...store,
        preferences: {
          ...store.preferences,
          [preferenceField]: value
        }
      };
    }
    return { ...store, [field]: value };
  });
}