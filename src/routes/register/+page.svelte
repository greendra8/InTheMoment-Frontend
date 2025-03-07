<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<svelte:head>
	<title>Register - InTheMoment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<div class="auth-page">
	<div class="auth-container">
		<h1 class="auth-title">Register</h1>

		<div class="notice-card">
			<div class="notice-icon">
				<i class="fas fa-info-circle"></i>
			</div>
			<p>We are not currently accepting new users. Please check back later.</p>
		</div>

		<form method="POST" use:enhance>
			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" name="email" required disabled />
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input type="password" id="password" name="password" required disabled />
			</div>
			{#if form?.message}
				<p class="error">{form.message}</p>
			{/if}
			<button type="submit" class="auth-button" disabled>Register</button>
		</form>
		<p class="auth-link">Already have an account? <a href="/login">Login</a></p>
	</div>
</div>

<style>
	.auth-page {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--background-image);
		background-attachment: var(--background-attachment);
		background-size: var(--background-size);
		padding: 2rem 1rem;
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
		backdrop-filter: blur(10px);
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

	.notice-card {
		display: flex;
		align-items: center;
		padding: 1rem 1.2rem;
		background: rgba(106, 90, 205, 0.1);
		border: 1px solid rgba(123, 104, 238, 0.2);
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.notice-icon {
		font-size: 1.5rem;
		color: rgba(123, 104, 238, 0.9);
		margin-right: 1rem;
		flex-shrink: 0;
	}

	.notice-card p {
		margin: 0;
		color: var(--text-primary);
		font-size: 0.95rem;
		line-height: 1.5;
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

	input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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

	.auth-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.auth-button:not(:disabled):hover {
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
</style>
