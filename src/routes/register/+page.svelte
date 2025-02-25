<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<!-- notice that we are not currently accepting new users -->

<div class="auth-container">
	<h1>Register</h1>
	<p>We are not currently accepting new users. Please check back later.</p>
	<form method="POST" use:enhance disabled>
		<div class="form-group">
			<label for="email">Email</label>
			<input type="email" id="email" name="email" required disabled />
		</div>
		<div class="form-group">
			<label for="password">Password</label>
			<input type="password" id="password" name="password" required disabled />
		</div>
		{#if form?.message}
			<p class="message">{form.message}</p>
		{/if}
		<button type="submit" disabled>Register</button>
	</form>
	<p>Already have an account? <a href="/login">Login</a></p>
</div>

<style>
	.auth-container {
		font-family: 'Lato', sans-serif;
		width: 100%;
		max-width: 400px;
		margin: 2rem auto;
		padding: 0 1rem;
		box-sizing: border-box;
	}

	h1 {
		font-family: 'Poppins', sans-serif;
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
		box-sizing: border-box;
	}

	button {
		width: 100%;
		padding: 0.75rem;
		background-color: #0e0e0e;
		color: #e1e1e1;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	button:hover {
		background-color: #000000;
	}

	.message {
		color: red;
		margin-top: 1rem;
		text-align: center;
	}

	p {
		text-align: center;
		margin-top: 1rem;
	}

	a {
		color: #0e0e0e;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
