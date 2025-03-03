import { writable } from 'svelte/store';

interface GenerationState {
    isGenerating: boolean;
    status: string;
    meditationId: string | null;
}

function createMeditationGenerationStore() {
    const { subscribe, set, update } = writable<GenerationState>({
        isGenerating: false,
        status: '',
        meditationId: null
    });

    return {
        subscribe,
        startGeneration: (meditationId: string) => update(state => ({
            ...state,
            isGenerating: true,
            meditationId,
            status: 'Queued'
        })),
        updateStatus: (status: string) => update(state => ({
            ...state,
            status
        })),
        completeGeneration: () => update(state => ({
            ...state,
            isGenerating: false,
            status: 'Completed'
        })),
        failGeneration: () => update(state => ({
            ...state,
            isGenerating: false,
            status: 'Failed'
        })),
        reset: () => set({
            isGenerating: false,
            status: '',
            meditationId: null
        })
    };
}

export const meditationGeneration = createMeditationGenerationStore(); 