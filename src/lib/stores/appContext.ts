import { writable } from 'svelte/store';

interface AppContext {
  isNativeApp: boolean;
  isNativeAppReady: boolean;
}

function createAppContext() {
  const { subscribe, update } = writable<AppContext>({
    isNativeApp: false,
    isNativeAppReady: false,
  });

  return {
    subscribe,
    setIsNativeApp: (value: boolean) => update(ctx => ({ ...ctx, isNativeApp: value })),
    setIsNativeAppReady: (value: boolean) => update(ctx => ({ ...ctx, isNativeAppReady: value })),
  };
}

export const appContext = createAppContext();