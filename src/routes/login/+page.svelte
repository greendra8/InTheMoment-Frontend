<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { page } from '$app/stores';

	export let form: ActionData;
	let useMagicLink = form?.useMagicLink ?? false; // Preserve state across submissions
	let showForgotPassword = false;
	let loginLoading = false;
	let resetLoading = false;

	// Email inputs - one for login/magic link, one for reset
	let loginEmail = form?.email ?? '';
	let resetEmail = form?.resetEmail ?? '';

	function toggleMagicLink() {
		useMagicLink = !useMagicLink;
		showForgotPassword = false; // Hide forgot password when toggling main mode
	}

	function toggleForgotPassword() {
		showForgotPassword = !showForgotPassword;
		useMagicLink = false; // Hide magic link when showing forgot password
	}

	// Reactive updates for loading state and preserving email input
	$: loginLoading =
		$page.form?.submitting &&
		$page.form?.action?.pathname === '/login' &&
		$page.form?.action?.search === '?/login';
	$: resetLoading = $page.form?.submitting && $page.form?.action?.search === '?/resetPassword';

	$: if (form?.email) loginEmail = form.email;
	$: if (form?.resetEmail) resetEmail = form.resetEmail;

	// Handle error params from callback
	let errorMessage = '';
	$: {
		const error = $page.url.searchParams.get('error');
		if (error === 'invalid_callback') {
			errorMessage = 'Invalid authentication request';
		} else if (error === 'auth_error') {
			errorMessage = 'Authentication failed';
		} else if (error === 'no_session') {
			errorMessage = 'Unable to establish session';
		} else if (error === 'server_error') {
			errorMessage = 'Server error occurred';
		} else {
			errorMessage = ''; // Clear errors if no error param
		}

		// Clear form-specific errors if the other form is submitted or mode changes
		if (form && !form.message && !form.resetError) {
			errorMessage = '';
		}
	}
</script>

<svelte:head>
	<title>Login - InTheMoment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="auth-page">
	<div class="auth-container">
		{#if showForgotPassword}
			<!-- Forgot Password Form -->
			<h1 class="auth-title">Reset Password</h1>
			<form method="POST" action="?/resetPassword" use:enhance>
				<div class="form-group">
					<label for="reset-email">Email</label>
					<input type="email" id="reset-email" name="email" bind:value={resetEmail} required />
				</div>

				{#if form?.resetError}
					<p class="error">{form.resetError}</p>
				{/if}
				{#if form?.resetSuccess}
					<p class="success">{form.resetSuccess}</p>
				{/if}

				<button type="submit" class="auth-button" disabled={resetLoading}>
					{#if resetLoading}
						<span class="loading loading-spinner loading-xs mr-2"></span> Sending...
					{:else}
						Send Reset Link
					{/if}
				</button>
			</form>
			<div class="auth-options">
				<button class="link-button" on:click={toggleForgotPassword}> Back to Login </button>
			</div>
		{:else}
			<!-- Login / Magic Link Form -->
			<h1 class="auth-title">{useMagicLink ? 'Magic Link Login' : 'Login'}</h1>
			<form method="POST" action="?/login" use:enhance>
				<div class="form-group">
					<label for="email">Email</label>
					<input type="email" id="email" name="email" bind:value={loginEmail} required />
				</div>
				{#if !useMagicLink}
					<div class="form-group">
						<label for="password">Password</label>
						<input type="password" id="password" name="password" required />
					</div>
				{/if}
				<input type="hidden" name="magicLink" value={useMagicLink.toString()} />

				<!-- Display general errors or login form specific errors/success -->
				{#if errorMessage}
					<p class="error">{errorMessage}</p>
				{:else if form?.message}
					<p class="error">{form.message}</p>
				{:else if form?.success}
					<p class="success">{form.success}</p>
				{/if}

				<button type="submit" class="auth-button" disabled={loginLoading}>
					{#if loginLoading}
						<span class="loading loading-spinner loading-xs mr-2"></span>
						{#if useMagicLink}
							Sending...
						{:else}
							Logging In...
						{/if}
					{:else}
						{useMagicLink ? 'Send Magic Link' : 'Login'}
					{/if}
				</button>
			</form>
			<div class="auth-options">
				<button class="link-button" on:click={toggleMagicLink}>
					{useMagicLink ? 'Use Password Login' : 'Use Magic Link Login'}
				</button>
				{#if !useMagicLink}
					<button class="link-button ml-4" on:click={toggleForgotPassword}>
						Forgot Password?
					</button>
				{/if}
			</div>
		{/if}

		<p class="auth-link">Don't have an account? <a href="/register">Register</a></p>
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

	.auth-options {
		margin-top: 1.5rem; /* Increased spacing */
		text-align: center;
		display: flex; /* Use flexbox for better alignment */
		justify-content: center; /* Center buttons */
		gap: 1rem; /* Add gap between buttons */
		flex-wrap: wrap; /* Allow wrapping on small screens */
	}

	.link-button {
		background: none;
		border: none;
		color: rgba(123, 104, 238, 0.9);
		cursor: pointer;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		/* text-decoration: underline; */ /* Removing underline for cleaner look */
		padding: 0.25rem 0; /* Add some padding for click area */
		transition: color 0.3s ease;
	}

	.link-button:hover {
		color: rgba(132, 112, 255, 1);
		text-decoration: underline; /* Add underline on hover */
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

	/* Add styles for loading spinner if using daisyUI or similar */
	/* Ensure loading class is available or replace with your spinner implementation */
	.loading {
		/* Example using daisyUI spinner */
		display: inline-block;
		vertical-align: middle;
	}

	.loading-spinner {
		/* daisyUI styles */
	}

	.loading-xs {
		/* daisyUI styles */
	}

	.mr-2 {
		margin-right: 0.5rem; /* Spacing for spinner */
	}
</style>
