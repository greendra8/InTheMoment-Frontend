<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
  const { meditation } = data;
</script>

<div class="meditation-container">
  <h1>{meditation.title}</h1>
  <p>Theme: {meditation.theme}</p>
  <p>Difficulty: {meditation.difficulty}</p>
  <p>Length: {meditation.length} minutes</p>
  
  {#if meditation.audio_url}
    <div class="audio-player">
      <h2>Meditation Audio</h2>
      <audio controls src={meditation.audio_url}>
        Your browser does not support the audio element.
      </audio>
    </div>
  {:else}
    <p>Audio not available for this meditation.</p>
  {/if}
  
  <a href="/dashboard" class="back-button">Back to Dashboard</a>
</div>

<style>
  .meditation-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1, h2 {
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 0.5rem;
  }

  .audio-player {
    margin-top: 2rem;
    margin-bottom: 2rem;
  }

  audio {
    width: 100%;
  }

  .back-button {
    display: inline-block;
    margin-top: 2rem;
    padding: 0.5rem 1rem;
    background-color: #4CAF50;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  }

  .back-button:hover {
    background-color: #45a049;
  }
</style>