<script lang="ts">
	import { supabase } from '$lib/supabaseClient';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData; // Data from server load
	export let form: ActionData; // Data from form action post-submission

	let password = '';
	let confirmPassword = '';
	let serverError: string | null = null; // For errors from load function
	let actionMessage: string | null = null; // For messages from action (success/fail)
	let actionSuccess = false;
	let loading = false;
	let showForm = false;
	let recoveryCode = ''; // To store the code for the hidden input

	// Process data from server load function
	$: if (data) {
		if (data.isLoggedIn) {
			serverError = data.error || 'Please use account settings to change your password.';
			showForm = false;
		} else if (data.codePresent && data.code) {
			serverError = null;
			showForm = true;
			recoveryCode = data.code;
		} else {
			serverError = data.error || 'Invalid or expired password reset link.';
			showForm = false;
		}
	}

	// Process results from the form action
	$: if (form) {
		if (form.success) {
			actionSuccess = true;
			actionMessage = form.message || 'Success!';
			showForm = false; // Hide form on success
			setTimeout(() => {
				goto('/login');
			}, 4000);
		} else {
			actionSuccess = false;
			actionMessage = form.message || 'An error occurred.';
			// Keep form visible on error to allow retry
		}
		loading = false; // Reset loading state when action data arrives
	}

	// Client-side validation and loading state management
	function handleSubmit() {
		actionMessage = null; // Clear previous action message on new submit
		actionSuccess = false;
		if (password !== confirmPassword) {
			actionMessage = 'Passwords do not match.';
			return; // Prevent submission
		}
		if (password.length < 6) {
			actionMessage = 'Password must be at least 6 characters long.';
			return; // Prevent submission
		}
		loading = true; // Set loading state for use:enhance
	}
</script>

<svelte:head>
	<title>Reset Password - InTheMoment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="auth-page">
	<div class="auth-container">
		<h1 class="auth-title">Reset Your Password</h1>

		{#if serverError}
			<!-- Display errors determined during page load -->
			<div class="error">
				<span>{serverError}</span>
			</div>
		{:else if showForm}
			<!-- Only show form if load determined it's okay -->
			<form method="POST" use:enhance on:submit={handleSubmit} class="space-y-4">
				<!-- Hidden input for the recovery code -->
				<input type="hidden" name="code" bind:value={recoveryCode} />

				<div class="form-group">
					<label for="password">New Password</label>
					<input
						type="password"
						id="password"
						name="password"
						bind:value={password}
						required
						minlength="6"
						placeholder="Enter new password (min 6 chars)"
						disabled={loading || actionSuccess}
					/>
				</div>
				<div class="form-group">
					<label for="confirmPassword">Confirm New Password</label>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						bind:value={confirmPassword}
						required
						minlength="6"
						placeholder="Confirm new password"
						disabled={loading || actionSuccess}
					/>
				</div>

				{#if actionMessage && !actionSuccess}
					<!-- Display action errors -->
					<p class="error">{actionMessage}</p>
				{/if}

				<button type="submit" class="auth-button" disabled={loading || actionSuccess}>
					{#if loading}
						<span class="loading loading-spinner loading-xs mr-2"></span> Updating...
					{:else if actionSuccess}
						Password Updated!
					{:else}
						Reset Password
					{/if}
				</button>
			</form>
		{/if}

		{#if actionMessage && actionSuccess}
			<!-- Display action success message -->
			<div class="success">
				<span>{actionMessage} Redirecting to login...</span>
			</div>
		{/if}

		<p class="auth-link">Remember your password? <a href="/login">Login</a></p>
	</div>
</div>

<style>
	.auth-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
	}

	.auth-container {
		width: 100%;
		max-width: 450px;
		padding: 2.5rem;
		box-sizing: border-box;
		background: linear-gradient(135deg, rgba(22, 22, 45, 0.85) 0%, rgba(28, 28, 55, 0.75) 100%);
		border-radius: 16px;
		box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(123, 104, 238, 0.15);
	}

	.auth-title {
		font-family: 'Poppins', sans-serif;
		text-align: center;
		margin-bottom: 2rem;
		color: var(--text-primary);
		font-size: 2.2rem;
		font-weight: 600;
		position: relative;
		display: inline-block;
		width: 100%;
	}

	.auth-title::after {
		content: '';
		position: absolute;
		bottom: -8px;
		left: 50%;
		transform: translateX(-50%);
		width: 60px;
		height: 2px;
		background: linear-gradient(90deg, rgba(106, 90, 205, 0.6), rgba(132, 112, 255, 0.6));
		border-radius: 2px;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
		font-family: 'Poppins', sans-serif;
		font-weight: 500;
		font-size: 0.95rem;
	}

	input {
		width: 100%;
		padding: 0.8rem 1rem;
		background: rgba(22, 22, 45, 0.5);
		color: var(--text-primary);
		border: 1px solid rgba(123, 104, 238, 0.2);
		border-radius: 8px;
		box-sizing: border-box;
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		transition: all 0.3s ease;
	}

	input:focus {
		outline: none;
		border-color: rgba(123, 104, 238, 0.5);
		box-shadow: 0 0 15px rgba(106, 90, 205, 0.2);
	}

	.auth-button {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(135deg, rgba(106, 90, 205, 0.8) 0%, rgba(132, 112, 255, 0.9) 100%);
		color: var(--text-primary);
		border: 1px solid rgba(123, 104, 238, 0.3);
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		margin-top: 1rem;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(106, 90, 205, 0.3);
	}

	.auth-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(106, 90, 205, 0.5);
		background: linear-gradient(135deg, rgba(106, 90, 205, 0.9) 0%, rgba(132, 112, 255, 1) 100%);
	}

	.error {
		color: #ff6b6b;
		margin: 1rem 0;
		text-align: center;
		font-size: 0.9rem;
		padding: 0.5rem;
		background: rgba(255, 107, 107, 0.1);
		border-radius: 4px;
		border: 1px solid rgba(255, 107, 107, 0.2);
	}

	.success {
		color: #4caf50;
		margin: 1rem 0;
		text-align: center;
		font-size: 0.9rem;
		padding: 0.5rem;
		background: rgba(76, 175, 80, 0.1);
		border-radius: 4px;
		border: 1px solid rgba(76, 175, 80, 0.2);
	}

	.auth-link {
		text-align: center;
		margin-top: 1.5rem;
		color: var(--text-secondary);
		font-size: 0.95rem;
	}

	a {
		color: rgba(123, 104, 238, 0.9);
		text-decoration: none;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	a:hover {
		color: rgba(132, 112, 255, 1);
		text-decoration: underline;
	}

	@media (max-width: 480px) {
		.auth-container {
			padding: 2rem 1.5rem;
		}

		.auth-title {
			font-size: 1.8rem;
		}
	}

	.loading {
		display: inline-block;
		vertical-align: middle;
	}

	.loading-spinner {
		/* DaisyUI styles */
	}

	.loading-xs {
		/* DaisyUI styles */
	}

	.mr-2 {
		margin-right: 0.5rem;
	}

	.space-y-4 > * + * {
		margin-top: 1rem;
	}
</style>
