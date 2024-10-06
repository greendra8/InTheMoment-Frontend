<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;
  export let form;

  let newPlaylist = '';

  function handleAddPlaylist() {
    newPlaylist = '';
  }
</script>

<svelte:head>
  <title>Admin Dashboard</title>
</svelte:head>

<div class="admin-dashboard">
  <h1><i class="fas fa-cogs"></i> Admin Dashboard</h1>

  <div class="playlist-list">
    <h2><i class="fas fa-list"></i> Playlists</h2>
    {#each data.playlists as playlist}
      <div class="playlist-item">
        <a href="/admin/playlist/{playlist.id}">
          <i class="fas fa-folder"></i> {playlist.playlist_order}. {playlist.playlist_name}
        </a>
        <form method="POST" action="?/deletePlaylist" use:enhance={() => {
          return async ({ result }) => {
            if (result.type === 'success') {
              await invalidateAll();
            }
          };
        }}>
          <input type="hidden" name="playlistId" value={playlist.id} />
          <button type="submit" class="delete-btn" title="Delete Playlist">
            <i class="fas fa-trash"></i>
          </button>
        </form>
      </div>
    {/each}
  </div>

  <div class="add-playlist">
    <h3><i class="fas fa-plus-circle"></i> Add New Playlist</h3>
    <form method="POST" action="?/addPlaylist" use:enhance={() => {
      return async ({ result }) => {
        if (result.type === 'success') {
          handleAddPlaylist();
          await invalidateAll();
        }
      };
    }}>
      <div class="input-group">
        <input name="playlist" bind:value={newPlaylist} placeholder="Enter new playlist name" required />
        <button type="submit">Add Playlist</button>
      </div>
    </form>
  </div>

  {#if form?.error}
    <p class="error"><i class="fas fa-exclamation-circle"></i> {form.error}</p>
  {/if}
</div>

<style>
  h1, h2, h3 {
    margin-bottom: 20px;
  }

  .playlist-list {
    margin-bottom: 30px;
  }

  .playlist-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    background-color: #f0f0f0;
    border-radius: 5px;
    overflow: hidden;
  }

  .playlist-item a {
    padding: 10px;
    text-decoration: none;
    color: #333;
    flex-grow: 1;
    transition: background-color 0.3s;
  }

  .playlist-item:hover {
    background-color: #c5c5c5;
  }


  i {
    margin-right: 3dpx;
  }

  .input-group {
    display: flex;
  }

  .input-group input {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-right: none;
    border-radius: 5px 0 0 5px;
  }

  button {
    padding: 10px 15px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  button:hover {
    background-color: #45a049;
  }

  .input-group button {
    border-radius: 0 5px 5px 0;
  }

  .delete-btn {
    color: #333;
    background-color: transparent;
    padding: 10px;
  }

  .delete-btn:hover {
    color: #f44336;
    background-color: transparent;
  }

  .error {
    color: #f44336;
    margin-top: 20px;
  }
</style>