<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';

  export let data: PageData;

  function getRandomGrey() {
    const greys = [
      { bg: '#4A4A4A', text: '#E1E1E1' },
      { bg: '#616161', text: '#E1E1E1' },
      { bg: '#757575', text: '#E1E1E1' },
      { bg: '#9E9E9E', text: '#E1E1E1' },
      { bg: '#BDBDBD', text: '#E1E1E1' },
    ];
    return greys[Math.floor(Math.random() * greys.length)];
  }
</script>

<svelte:head>
  <title>Playlists</title>
</svelte:head>

<div class="playlists-page">
  <h1>Playlists</h1>

  <!-- info label saying that all playlists and lessons are created by humans -->
  <p class="info-label">
    <i class="fas fa-info-circle"></i>
    All playlists and lessons are created by humans.
  </p>

  <div class="playlist-grid">
    {#each data.playlists as playlist, index (playlist.id)}
      {@const colors = getRandomGrey()}
      <div 
        class="playlist-card"
        class:full-width={index === 0}
        style="--card-bg-color: {colors.bg}; --card-text-color: {colors.text};"
        on:click={() => goto(`/playlists/${playlist.id}`)}
        on:keydown={(e) => {
          if (e.key === 'Enter') goto(`/playlists/${playlist.id}`);
        }}
        tabindex="0"
        role="button"
      >
        <div class="playlist-icon">
          <i class="fas fa-play-circle"></i>
        </div>
        <h2>{playlist.playlist_name}</h2>
        <div class="playlist-arrow">
          <i class="fas fa-arrow-right"></i>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  h1 {
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    color: #333;
    margin-bottom: 1.5rem;
  }

  .info-label {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 1.5rem;
  }

  .playlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  }

  .playlist-card {
    background-color: transparent;
    color: #333;
    border-radius: 12px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    border: 1px solid #706b5780;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .playlist-card.full-width {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    align-items: center;
  }

  .full-width .playlist-icon {
    grid-column: 1;
    grid-row: 1 / 3;
    font-size: 2.5rem;
    margin-right: 1rem;
  }

  .full-width h2 {
    grid-column: 2;
    grid-row: 1 / 3;
    font-size: 1.3rem;
    align-self: center;
  }

  .full-width .playlist-arrow {
    grid-column: 3;
    grid-row: 1 / 3;
    font-size: 1.3rem;
    justify-self: end;
    align-self: center;
  }

  .playlist-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  .playlist-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .playlist-card h2 {
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 500;
    margin: 0;
    line-height: 1.2;
  }

  .playlist-arrow {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    font-size: 1rem;
    opacity: 0;
    transition: all 0.3s ease;
  }

  .full-width .playlist-arrow {
    position: static;
    opacity: 1;
  }

  .playlist-card:hover .playlist-arrow {
    opacity: 1;
    transform: translateX(5px);
  }

  @media (max-width: 768px) {
    .playlist-card {
      padding: 1rem;
    }

    .playlist-card.full-width {
      padding: 0.75rem 1rem;
    }

    .full-width .playlist-icon {
      font-size: 2rem;
    }

    .full-width h2 {
      font-size: 1.1rem;
    }

    .playlist-icon {
      font-size: 1.5rem;
    }

    .playlist-card h2 {
      font-size: 1rem;
    }
  }
</style>