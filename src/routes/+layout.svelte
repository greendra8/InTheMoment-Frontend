<script lang="ts">
  import '../app.css';
  import { invalidate } from '$app/navigation';
  import { goto } from '$app/navigation';
	import { onMount } from 'svelte';



	export let data;
	$: ({ session, supabase } = data);

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});

	async function handleLogout() {
		const { error } = await supabase.auth.signOut();
		if (!error) {
			await invalidate('supabase:auth');
			goto('/login');
		}
	}
</script>

<div class="container">
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      {#if session}
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/meditation">Meditation</a></li>
        <li><button on:click={handleLogout}>Logout</button></li>
      {:else}
        <li><a href="/login">Login</a></li>
        <li><a href="/register">Register</a></li>
      {/if}
    </ul>
  </nav>

  <main>
    <slot />
  </main>
</div>

<style>
  :global(body) {
    font-family: 'Roboto', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  nav {
    margin-bottom: 2rem;
  }

  nav ul {
    display: flex;
    list-style: none;
    padding: 0;
    gap: 1rem;
  }

  main {
    padding: 1rem;
  }

  @media (max-width: 1024px) {
    .container {
      padding: 1rem 0.5rem;
    }
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: inherit;
    color: inherit;
    padding: 0;
    margin: 0;
  }

  button:hover {
    text-decoration: underline;
  }
</style>
