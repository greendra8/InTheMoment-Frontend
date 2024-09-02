<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="dashboard-container">
  <h1>Dashboard</h1>

  <h2>Meditation History</h2>
  {#if data.meditations.length > 0}
    <ul>
      {#each data.meditations as meditation}
        <li>
          <div class="meditation-info">
            {#if meditation.status === 'processing'}
              <h3>Processing Meditation...</h3>
              <p>Theme: {meditation.theme || 'N/A'} | Difficulty: {meditation.difficulty || 'N/A'} | Length: {meditation.length || 'N/A'} min</p>
            {:else}
              <h3>{meditation.title || 'Untitled Meditation'}</h3>
              <p>Theme: {meditation.theme || 'N/A'} | Difficulty: {meditation.difficulty || 'N/A'} | Length: {meditation.length || 'N/A'} min</p>
            {/if}
          </div>
          {#if meditation.status !== 'processing'}
            <a href="/meditation/{meditation.id}" class="play-button">Play</a>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p>No meditation history available.</p>
  {/if}
</div>

<style>
  .dashboard-container {
    max-width: 800px;
    margin: 0 auto;
  }

  h1, h2, h3 {
    margin-bottom: 0.5rem;
  }

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
    background-color: #f9f9f9;
    border-radius: 4px;
  }

  .meditation-info {
    flex-grow: 1;
  }

  .meditation-info h3 {
    font-size: 1.1rem;
    margin-bottom: 0.2rem;
  }

  .meditation-info p {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
  }

  button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:disabled {
    background-color: #cccccc;
  }

  .error {
    color: red;
    margin-top: 1rem;
  }

  .play-button {
    padding: 0.3rem 0.8rem;
    background-color: #4CAF50;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .play-button:hover {
    background-color: #45a049;
  }
</style>