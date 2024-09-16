import { writable } from 'svelte/store';

type ProfileSetup = {
  meditationGoal: string;
  stressLevel: string;
  sleepPattern: string;
  focusDuration: string;
  mentalState: string;
  techUsage: string;
};

export const profileSetupStore = writable<ProfileSetup>({
  meditationGoal: '',
  stressLevel: '',
  sleepPattern: '',
  focusDuration: '',
  mentalState: '',
  techUsage: ''
});

export function updateProfileSetupStore(key: keyof ProfileSetup, value: string) {
  profileSetupStore.update(store => ({ ...store, [key]: value }));
}