<script lang="ts">
  import { getUserMeditations } from '$lib/api';
  import type { PageData } from './$types';

  export let data: PageData;

  let meditations = data.meditations || [];
  let currentPage = data.currentPage;
  let isLoading = false;
  let error = '';

  async function loadMore() {
    isLoading = true;
    error = '';
    try {
      const newMeditations = await getUserMeditations(data.session.user.id, currentPage + 1);
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
  <h1>Your Library</h1>
  <h2>Most Recent</h2>

  {#if meditations.length > 0}
    <ul>
      {#each meditations as meditation (meditation.id)}
        <li>
          <div class="meditation-info">
            {#if meditation.status === 'processing'}
              <!-- Display for processing meditations -->
              <h3>Processing Meditation...</h3>
              <p>{meditation.lesson_playlists ? `Playlist: ${meditation.lesson_playlists.playlist_name}` : `Theme: ${meditation.theme || 'N/A'}`}</p>
              <p>Length: {meditation.length || 'N/A'} min</p>
            {:else}
              <!-- Display for completed meditations -->
              <h3 class="title-wrapper">
                <span class="title-text">{meditation.title || 'Untitled Meditation'}</span>
                {#if meditation.listened}
                  <span class="icon-wrapper">
                    <i class="fas fa-check-circle listened-icon"></i>
                  </span>
                {/if}
              </h3>
              <p>{meditation.lesson_playlists ? `Playlist: ${meditation.lesson_playlists.playlist_name}` : `Theme: ${meditation.theme || 'N/A'}`}</p>
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
  /* Container styles */
  .meditations-list-container {
    font-family: 'Lato', sans-serif;
    max-width: 800px;
    margin: 0;
  }

  /* Typography styles */
  h1, h2, h3 {
    font-family: 'Poppins', sans-serif;
    margin-bottom: 0.5rem;
  }

  /* List styles */
  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0.5rem;
    border-radius: 10px;
    background-color: #e8e8e8;
  }

  /* Meditation info styles */
  .meditation-info {
    flex-grow: 1;
    margin-right: 1rem;
  }

  .meditation-info p {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
  }

  /* Title and icon styles */
  .title-wrapper {
    font-size: 1.1rem;
    margin: 0.2rem 0;
    line-height: 1.4;
  }

  .title-text {
    display: inline;
  }

  .icon-wrapper {
    display: inline-block;
    width: 0;
    position: relative;
  }

  .listened-icon {
    font-size: 12px;
    position: absolute;
    top: -1em;
    left: 1px;
    color: #4caf50;
    white-space: nowrap;
  }

  /* Button styles */
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

  /* Play button styles */
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
    white-space: nowrap;
  }

  .play-button svg {
    margin-right: 0.2rem;
    width: 18px;
    height: 18px;
  }

  .play-button:active {
    background-color: #000;
  }

  /* Error message style */
  .error {
    color: red;
    margin-top: 1rem;
  }

  /* Responsive styles */
  @media (max-width: 600px) {
    li {
      flex-direction: row;
      align-items: center;
    }

    .play-button {
      margin-top: 0;
      align-self: center;
    }
  }
</style>