import type { Load } from '@sveltejs/kit';

export function protectRoute(load: Load): Load {
  return async (event) => {
    // For now, we're not doing any protection
    return load ? load(event) : {};
  };
}