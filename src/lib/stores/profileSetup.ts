import { writable } from 'svelte/store';

export type ProfileSetup = {
  meditationGoal: string;
  stressLevel: string;
  sleepPattern: string;
  focusDuration: string;
  mentalState: string;
  techUsage: string;
};

const initialState: ProfileSetup = {
  meditationGoal: '',
  stressLevel: '',
  sleepPattern: '',
  focusDuration: '',
  mentalState: '',
  techUsage: ''
};

export const profileSetupStore = writable<ProfileSetup>(initialState);

export function updateProfileSetupStore(key: string, value: string) {
  profileSetupStore.update(store => ({ ...store, [key]: value }));
}

export function resetProfileSetupStore() {
  profileSetupStore.set(initialState);
}