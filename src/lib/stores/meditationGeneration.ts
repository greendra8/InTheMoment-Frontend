import { writable } from 'svelte/store';

// Define the type for the meditation generation state
type MeditationGenerationState = {
    isGenerating: boolean;
    meditationId: string | null;
    status: string;
    sessionType: string;
};

// Create the initial state
const initialState: MeditationGenerationState = {
    isGenerating: false,
    meditationId: null,
    status: '',
    sessionType: 'meditation'
};

// Create the writable store
const createMeditationGenerationStore = () => {
    const { subscribe, set, update } = writable<MeditationGenerationState>(initialState);

    return {
        subscribe,
        startGeneration: (meditationId: string, sessionType: string = 'meditation') =>
            update(state => ({
                ...state,
                isGenerating: true,
                meditationId,
                status: 'Queued',
                sessionType
            })),
        updateStatus: (status: string) =>
            update(state => ({ ...state, status })),
        completeGeneration: () =>
            update(state => ({ ...state, isGenerating: false, status: 'Completed' })),
        failGeneration: () =>
            update(state => ({ ...state, isGenerating: false, status: 'Failed' })),
        reset: () => set(initialState)
    };
};

// Export the store
export const meditationGeneration = createMeditationGenerationStore(); 