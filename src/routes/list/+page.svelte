<script lang="ts">
  import { getUserMeditations } from '$lib/supabase';
  import type { PageData } from './$types';
  import { page } from '$app/stores';

  export let data: PageData;

  let meditations = data.meditations || [];
  let currentPage = data.currentPage;
  let isLoading = false;
  let error = '';

  async function loadMore() {
    isLoading = true;
    error = '';
    try {
      const newMeditations = await getUserMeditations($page.data.session?.user.id, currentPage + 1);
      if (newMeditations.length) {
        meditations = [...meditations, ...newMeditations];
        currentPage += 1;
      }
    } catch (err) {
      console.error('Error loading more meditations:', err);
      error = 'Failed to load more meditations. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="meditations-list-container">
  <h1>Your Sessions</h1>

  <h2>Most Recent</h2>
  {#if meditations.length > 0}
    <ul>
      {#each meditations as meditation (meditation.id)}
        <li>
          <div class="meditation-info">
            {#if meditation.status === 'processing'}
              <h3>Processing Meditation...</h3>
              <p>Theme: {meditation.theme || 'N/A'}</p>
              <p>Length: {meditation.length || 'N/A'} min</p>
            {:else}
              <h3>
                {meditation.title || 'Untitled Meditation'}
                {#if meditation.listened}
                  <i style="font-size:12px; vertical-align: middle; margin-top: -3px;color: #4caf50;" class="fas fa-check-circle"></i>
                {/if}
              </h3>
              <p>Theme: {meditation.theme || 'N/A'}</p>
              <p>Length: {meditation.length || 'N/A'} min</p>
            {/if}
          </div>
          {#if meditation.status !== 'processing'}
            <a href="/meditation/{meditation.id}" class="play-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Play
            </a>
          {/if}
        </li>
      {/each}
    </ul>
    <button on:click={loadMore} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Load More'}
    </button>
  {:else}
    <p>No meditations available.</p>
  {/if}

  {#if error}
    <p class="error">{error}</p>
  {/if}
</div>

<style>
  .meditations-list-container {
    font-family: 'Lato', sans-serif;
    max-width: 800px;
    margin: 0;
  }

  h1, h2, h3 {
    font-family: 'Poppins', sans-serif;
    margin-bottom: 0.5rem;
  }

  ul {
    list-style-type: none;
    padding: 0;
    
  }

  li {
    display: flex;
    justify-content: space-between;
    align-items: center; /* Change from stretch to center */
    margin-bottom: 1rem;
    padding: 0.5rem;
    border-radius: 10px;
    background-color: #e8e8e8;
  }

  .meditation-info {
    flex-grow: 1;
    margin-right: 1rem;
  }

  .meditation-info h3 {
    font-size: 1.1rem;
    margin: 0.2rem 0;
  }

  .meditation-info p {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
  }

  button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #333;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .error {
    color: red;
    margin-top: 1rem;
  }

  .play-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.3rem 0.5rem;
    background-color: #333;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.8rem;
    min-width: 70px;
    align-self: center;
    white-space: nowrap; /* Ensure the button text doesn't wrap */
  }

  .play-button svg {
    margin-right: 0.2rem;
    width: 18px;
    height: 18px;
  }

  .play-button:hover {
    background-color: #000;
  }

  @media (max-width: 600px) {
    .meditations-list-container {
      
    }

    li {
      flex-direction: row; /* Ensure the flex direction remains row */
      align-items: center; /* Ensure items are centered vertically */
    }

    .play-button {
      margin-top: 0; /* Remove top margin */
      align-self: center; /* Ensure the button stays centered */
    }
  }
</style>