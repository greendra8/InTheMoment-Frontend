import { redirect } from '@sveltejs/kit';
import type { LoadEvent } from '@sveltejs/kit';
import { authStore } from '$lib/stores/auth';

export async function requireAuth({ url }: LoadEvent) {
  console.log('requireAuth called for URL:', url.pathname);
  const user = await authStore.check();
  console.log('requireAuth user:', user);

  if (!user) {
    console.log('User not authenticated, redirecting to login');
    throw redirect(303, `/login?redirectTo=${url.pathname}`);
  }

  return { user };
}

export async function getAuthUser() {
  return authStore.check();
}