<script lang="ts">
  import '../app.css';
  import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

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

	$: isHomePage = $page.url.pathname === '/';
</script>

{#if !isHomePage}
  <nav>
    <div class="nav-content">
      <ul>
        {#if !session}
          <li><a href="/">Home</a></li>
        {/if}
        {#if session}
          <li><a href="/dashboard">Dashboard</a></li>
          <li><a href="/meditation">Meditation</a></li>
        {:else}
          <li><a href="/login">Login</a></li>
          <li><a href="/register">Register</a></li>
        {/if}
      </ul>
      {#if session}
        <div class="profile-icon">
          <a href="/profile">
            <i style="font-size: 24px" class="fas fa-user"></i>
          </a>
        </div>
      {/if}
    </div>
  </nav>
{/if}

<main class:full-width={isHomePage}>
  <div class="content-container">
    <slot />
  </div>
</main>

<style>
  :global(body) {
    font-family: 'Roboto', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
  }

  .app-wrapper {
    width: 100%;
  }

  nav {
    width: 100%;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .nav-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .profile-icon {
    font-size: 1.5rem;
    color: #333;
  }

  nav ul {
    display: flex;
    list-style: none;
    padding: 0;
    gap: 1rem;
  }

  main {
    /* width: 100%; */ /* Remove this line */
  }

  .content-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 1rem;
  }

  main.full-width .content-container {
    max-width: none;
    padding: 0;
  }

  @media (max-width: 1024px) {
    .nav-content,
    .content-container {
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

  /* Disable purple color for visited links */
  :global(a:visited) {
    color: inherit;
  }
</style>
