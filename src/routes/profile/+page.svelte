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

<div class="profile-container">
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
      <button type="submit" class="update-button">Update Profile</button>
    </form>

    <br>
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
</div>

<style>
  .profile-container {
    font-family: 'Lato', sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  h1 {
    font-family: 'Poppins', sans-serif;
    color: #333;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .stats {
    background-color: #f0f0f0;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .stats p {
    margin: 0;
    font-size: 1.1rem;
  }

  .stats span {
    font-weight: bold;
    color: #4CAF50;
  }

  form {
    background-color: #ffffff;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
  }

  input, select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }

  .update-button, .logout-button {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .update-button {
    background-color: #4CAF50;
    color: white;
    margin-bottom: 1rem;
  }

  .update-button:hover {
    background-color: #45a049;
  }

  .logout-button {
    background-color: #f44336;
    color: white;
  }

  .logout-button:hover {
    background-color: #d32f2f;
  }

  .message {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 4px;
    text-align: center;
  }

  .success {
    background-color: #dff0d8;
    color: #3c763d;
  }

  .error {
    background-color: #f2dede;
    color: #a94442;
  }

  @media (max-width: 600px) {
    .profile-container {
      padding: 1rem;
    }

    form {
      padding: 1rem;
    }
  }
</style>