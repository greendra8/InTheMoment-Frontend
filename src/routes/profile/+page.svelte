<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let { profile } = data;
</script>

<h1>User Profile</h1>

<form method="POST" action="?/updateProfile" use:enhance>
  <div>
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" value={profile.name || ''} required>
  </div>
  <div>
    <label for="experienceLevel">Experience Level:</label>
    <select id="experienceLevel" name="experienceLevel" required>
      <option value="beginner" selected={profile.experience_level === 'beginner'}>Beginner</option>
      <option value="intermediate" selected={profile.experience_level === 'intermediate'}>Intermediate</option>
      <option value="advanced" selected={profile.experience_level === 'advanced'}>Advanced</option>
    </select>
  </div>
  <button type="submit">Update Profile</button>
</form>

{#if form?.success}
  <p class="success">Profile updated successfully!</p>
{/if}

{#if form?.message}
  <p class="error">{form.message}</p>
{/if}

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 300px;
    margin: 0 auto;
  }
  .success {
    color: green;
  }
  .error {
    color: red;
  }
</style>