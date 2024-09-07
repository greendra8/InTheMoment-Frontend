<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import { invalidate } from '$app/navigation';
  import { goto } from '$app/navigation';

  export let data: PageData;
  export let form: ActionData;

  let profile = data.profile;

  async function handleLogout() {
    const { error } = await data.supabase.auth.signOut({ scope: 'local' });
    if (!error) {
      await invalidate('supabase:auth');
      window.location.href = '/';
    }
  }

  function updateProfile(event: SubmitEvent) {
    return async ({ result }: { result: ActionData }) => {
      if (result.type === 'success' && result.data) {
        profile.profile = result.data;
      }
    };
  }
</script>

{#if profile}
  <h1>User Profile</h1>

  <div class="stats">
    <p>Minutes Listened: <span>{profile.minutes_listened}</span></p>
  </div>

  <form method="POST" action="?/updateProfile" use:enhance={updateProfile}>
    <div class="form-group">
      <label for="name">Name:</label>
      <input type="text" id="name" name="name" value={profile.full_name ?? ''} required>
    </div>
    <div class="form-group">
      <label for="experienceLevel">Experience Level:</label>
      <select id="experienceLevel" name="experienceLevel" value={profile.experience ?? 'beginner'} required>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
    </div>
    <button type="submit">Update Profile</button>
  </form>

  <button class="logout-button" on:click={handleLogout}>Logout</button>

  {#if form?.type === 'success'}
    <p class="message success">Profile updated successfully!</p>
  {/if}

  {#if form?.type === 'error'}
    <p class="message error">{form.error}</p>
  {/if}
{:else}
  <p>Loading profile...</p>
{/if}

<style>
  h1 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #333;
  }

  .stats {
    background-color: #e9e9e9;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }

  .stats p {
    margin: 0;
    font-weight: bold;
  }

  .stats span {
    font-weight: normal;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  label {
    margin-bottom: 0.5rem;
    font-weight: bold;
  }

  input, select {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    background-color: #4CAF50;
    color: white;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
  }

  button:hover {
    background-color: #45a049;
  }

  .message {
    text-align: center;
    padding: 0.75rem;
    border-radius: 4px;
    margin-top: 1rem;
  }

  .success {
    background-color: #dff0d8;
    color: #3c763d;
  }

  .error {
    background-color: #f2dede;
    color: #a94442;
  }

  .logout-button {
    background-color: #f44336;
    margin-top: 1rem;
  }

  .logout-button:hover {
    background-color: #d32f2f;
  }

  @media (max-width: 600px) {
    form {
      padding: 0 1rem;
    }

    input, select {
      width: 100%;
    }
  }
</style>