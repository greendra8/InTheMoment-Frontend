<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import { invalidate } from '$app/navigation';
  import { goto } from '$app/navigation';

  export let data: PageData;
  export let form: ActionData;

  $: ({ profile, supabase } = data);

  $: if (form?.success) {
    profile = form.profile;
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      await invalidate('supabase:auth');
      goto('/login');
    }
  }
</script>

<div class="profile-container">
  <h1>Your Profile</h1>

  <div class="stats">
    <div class="stat-item">
      <span class="stat-label">Minutes Meditated</span>
      <span class="stat-value">{profile.minutes_meditated}</span>
    </div>
  </div>

  <form method="POST" action="?/updateProfile" use:enhance class="profile-form">
    <div class="form-group">
      <label for="name">Name</label>
      <input id="name" name="name" value={profile.name} />
    </div>
    <div class="form-group">
      <label for="email">Email</label>
      <input id="email" name="email" value={profile.email} />
    </div>
    <button type="submit" class="button primary">Update Profile</button>
  </form>

  {#if form?.success}
    <p class="success-message">Profile updated successfully!</p>
  {:else if form?.error}
    <p class="error-message">Error: {form.error}</p>
  {/if}

  <button on:click={handleLogout} class="button secondary logout-button">Logout</button>
</div>

<style>
  .profile-container {
 
  }

  h1 {
    font-family: 'Playfair Display', serif;
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    text-align: center;
    color: #333;
  }

  .stats {
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-label {
    font-weight: bold;
    color: #555;
  }

  .stat-value {
    font-size: 1.2rem;
    color: #333;
  }

  .profile-form {
    margin-bottom: 2rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #555;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }

  .button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    text-decoration: none;
    color: #fff;
    background-color: #333;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .button:hover {
    background-color: #444;
  }

  .button.primary {
    background-color: #4CAF50;
  }

  .button.primary:hover {
    background-color: #45a049;
  }

  .button.secondary {
    background-color: #f44336;
  }

  .button.secondary:hover {
    background-color: #d32f2f;
  }

  .logout-button {
    display: block;
    margin: 2rem auto 0;
  }

  .success-message {
    color: #4CAF50;
    text-align: center;
    margin-top: 1rem;
  }

  .error-message {
    color: #f44336;
    text-align: center;
    margin-top: 1rem;
  }
</style>