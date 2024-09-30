// This module creates a transition store used to manage fade-in and fade-out effects
// between questions in the profile setup process. It controls visibility and opacity
// of elements to create smooth transitions.

import { writable } from 'svelte/store';

function createTransitionStore() {
    const { subscribe, set, update } = writable({
        visible: true,
        opacity: 1
    });

    return {
        subscribe,
        fadeOut: () => update(state => ({ ...state, opacity: 0 })),
        fadeIn: () => update(state => ({ ...state, opacity: 1 })),
        setVisible: (visible: boolean) => update(state => ({ ...state, visible }))
    };
}

export const transition = createTransitionStore();