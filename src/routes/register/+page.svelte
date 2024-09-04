<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<div class="auth-container">
  <h1>Register</h1>
  <form method="POST" use:enhance>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required />
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required />
    </div>
    {#if form?.message}
      <p class="message">{form.message}</p>
    {/if}
    <button type="submit">Register</button>
  </form>
  <p>Already have an account? <a href="/login">Login</a></p>
</div>

<style>
  .auth-container {
    width: 400px;
    margin: auto;
    padding: 2rem;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  h1 {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    width: 100%;
    padding: 0.75rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  button:hover {
    background-color: #45a049;
  }

  .message {
    color: #4CAF50;
    margin-top: 1rem;
    text-align: center;
  }

  p {
    text-align: center;
    margin-top: 1rem;
  }

  a {
    color: #4CAF50;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
</style>