<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>Course Playlists</title>
</svelte:head>

<div class="playlists-page">
  <h1>Course Playlists</h1>

  {#each data.playlists as playlist (playlist.id)}
    <div class="playlist">
      <h2>{playlist.playlist_name}</h2>
      <ul class="lesson-list">
        {#each playlist.lessons as lesson (lesson.id)}
          <li>
            <a href="/lesson/{lesson.id}">
              <div class="lesson-info">
                <h3>{lesson.lesson_title}</h3>
                <p>Lesson {lesson.lesson_number}</p>
              </div>
              <div class="create-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Create
              </div>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>

<style>
  .playlists-page {
    font-family: 'Lato', sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  h1, h2, h3 {
    font-family: 'Poppins', sans-serif;
    margin-bottom: 0.5rem;
  }

  .playlist {
    margin-bottom: 1.5rem;
  }

  .lesson-list {
    list-style-type: none;
    padding: 0;
  }

  .lesson-list li {
    margin-bottom: 0.5rem;
  }

  .lesson-list a {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-decoration: none;
    color: #333;
    background-color: #f0f0f0;
    padding: 0.5rem;
    border-radius: 5px;
    transition: background-color 0.3s;
  }

  .lesson-list a:hover {
    background-color: #e0e0e0;
  }

  .lesson-info {
    flex-grow: 1;
  }

  .lesson-info h3 {
    font-size: 1rem;
    margin: 0;
  }

  .lesson-info p {
    font-size: 0.8rem;
    color: #666;
    margin: 0;
  }

  .create-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.2rem 0.4rem;
    background-color: #4CAF50;
    color: white;
    border-radius: 3px;
    font-size: 0.8rem;
    min-width: 60px;
    white-space: nowrap;
  }

  .create-button svg {
    margin-right: 0.2rem;
    width: 14px;
    height: 14px;
  }
</style>