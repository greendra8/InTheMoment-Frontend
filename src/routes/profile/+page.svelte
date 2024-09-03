<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import { invalidate } from '$app/navigation';
  import { goto } from '$app/navigation';

  export let data: PageData;
  export let form: ActionData;

  let { profile } = data;

  $: ({ profile, supabase } = data);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      await invalidate('supabase:auth');
      goto('/login');
    }
  }
</script>

  <h1>User Profile</h1>

  <div class="stats">
    <p>Minutes Meditated: <span>{profile.minutes_meditated}</span></p>
  </div>

  <form method="POST" action="?/updateProfile" use:enhance>
    <div class="form-group">
      <label for="name">Name:</label>
      <input type="text" id="name" name="name" value={profile.name || ''} required>
    </div>
    <div class="form-group">
      <label for="experienceLevel">Experience Level:</label>
      <select id="experienceLevel" name="experienceLevel" required>
        <option value="beginner" selected={profile.experience_level === 'beginner'}>Beginner</option>
        <option value="intermediate" selected={profile.experience_level === 'intermediate'}>Intermediate</option>
        <option value="advanced" selected={profile.experience_level === 'advanced'}>Advanced</option>
      </select>
    </div>
    <button type="submit">Update Profile</button>
  </form>

  <button class="logout-button" on:click={handleLogout}>Logout</button>

  {#if form?.success}
    <p class="message success">Profile updated successfully!</p>
  {/if}

  {#if form?.message}
    <p class="message error">{form.message}</p>
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
</style>