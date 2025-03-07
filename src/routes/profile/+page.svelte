<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import ThemeToggle from '../../components/ThemeToggle.svelte';
	import { theme, setTheme } from '$lib/stores/theme';
	import { showSuccess, showError } from '$lib/stores/notifications';
	import { session } from '$lib/stores/session';

	export let data: PageData;
	export let form: ActionData;

	// Initialize the profile from the loaded data
	let profile = data.profile;

	// Reactive statement to update profile when data or form changes
	$: {
		if (form?.type === 'success' && form.data) {
			profile = form.data.profile;
		}
	}

	const voiceOptions = [
		{ id: 0, label: 'Female 1' },
		{ id: 1, label: 'Female 2' },
		{ id: 2, label: 'Male 1' },
		{ id: 3, label: 'Male 2' }
	];

	async function handleLogout() {
		const { error } = await supabase.auth.signOut({ scope: 'local' });
		if (!error) {
			await invalidate('supabase:auth');
			window.location.href = '/';
		}
	}

	let formElement: HTMLFormElement;

	function handleSubmit() {
		// Clear any existing notifications if needed
	}

	function handleUpdateSuccess() {
		showSuccess('Profile updated successfully!');
	}

	function handleThemeChange(newTheme: 'light' | 'dark' | 'cosmic') {
		// Explicitly set theme with saveToDb=true since this is a user action
		setTheme(newTheme, true);
		showSuccess(`Theme changed to ${newTheme}`);
	}
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="profile-container">
	{#if profile}
		<h1>Your Profile</h1>

		<div class="stats-strip">
			<div class="stat-item">
				<i class="fas fa-clock"></i>
				<div class="stat-text">
					<h3>{profile.minutes_listened}</h3>
					<p>Minutes Listened</p>
				</div>
			</div>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				return ({ result }) => {
					if (result.type === 'success') {
						handleUpdateSuccess();
					} else if (result.type === 'error') {
						showError(result.error);
					}
				};
			}}
			on:submit={handleSubmit}
			bind:this={formElement}
		>
			<div class="form-group">
				<label for="name">Name</label>
				<input type="text" id="name" name="name" value={profile.name ?? ''} required />
			</div>
			<div class="form-group">
				<label for="experience">Experience Level</label>
				<select id="experience" name="experience" required>
					<option value="beginner" selected={profile.experience === 'beginner'}>Beginner</option>
					<option value="intermediate" selected={profile.experience === 'intermediate'}
						>Intermediate</option
					>
					<option value="advanced" selected={profile.experience === 'advanced'}>Advanced</option>
				</select>
			</div>
			<div class="form-group">
				<label for="voice_id">Preferred Voice</label>
				<select id="voice_id" name="voice_id" required>
					{#each voiceOptions as option}
						<option value={option.id} selected={profile.voice_id === option.id}
							>{option.label}</option
						>
					{/each}
				</select>
			</div>
			<button type="submit" class="update-button">Update Profile</button>
		</form>

		<div class="theme-section">
			<h2>Appearance</h2>
			<div class="theme-toggle-wrapper">
				<span class="theme-label">Theme</span>
				<div class="theme-toggle-container">
					<button
						class="theme-option cosmic-option {$theme === 'cosmic' ? 'active' : ''}"
						on:click={() => handleThemeChange('cosmic')}
					>
						<i class="fas fa-rocket"></i>
						Cosmic
					</button>
					<button
						class="theme-option light-option {$theme === 'light' ? 'active' : ''}"
						on:click={() => handleThemeChange('light')}
					>
						<i class="fas fa-sun"></i>
						Light
					</button>
					<button
						class="theme-option dark-option {$theme === 'dark' ? 'active' : ''}"
						on:click={() => handleThemeChange('dark')}
					>
						<i class="fas fa-moon"></i>
						Dark
					</button>
				</div>
			</div>
		</div>

		<button class="logout-button" on:click={handleLogout}>Logout</button>
	{:else}
		<p class="loading">Loading profile...</p>
	{/if}
</div>

<style>
	.profile-container {
		width: 100%;
		padding: 1.5rem 0;
	}

	h1,
	h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 600;
		color: var(--text-primary);
	}

	h1 {
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		margin-bottom: 1.5rem;
	}

	h2 {
		font-size: 1.3rem;
		margin-bottom: 1rem;
	}

	.stats-strip {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		background-color: var(--background-card);
		border-radius: 12px;
		padding: 0.75rem 1.5rem;
		margin-bottom: 2rem;
		box-shadow: 0 2px 8px var(--ui-shadow);
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.stat-item i {
		font-size: 1.4rem;
		color: var(--icon-primary);
	}

	.stat-text {
		display: flex;
		flex-direction: column;
	}

	.stat-text h3 {
		font-size: 1.3rem;
		margin: 0;
		line-height: 1.2;
		font-family: 'Space Grotesk', sans-serif;
		color: var(--text-primary);
	}

	.stat-text p {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin: 0;
	}

	form {
		background-color: var(--background-card);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1rem;
		box-shadow: 0 2px 8px var(--ui-shadow);
	}

	.form-group {
		margin-bottom: 1.25rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-weight: 500;
	}

	input,
	select {
		width: 100%;
		padding: 0.75rem;
		background-color: var(--background-cardHover);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		font-size: 0.95rem;
		font-family: 'Inter', sans-serif;
		color: var(--text-primary);
		box-sizing: border-box;
	}

	/* Remove dropdown arrow from text input */
	input[type='text'] {
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
	}

	/* Style select dropdowns */
	select {
		appearance: none;
		-webkit-appearance: none;
		-moz-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 1rem center;
		padding-right: 2.5rem;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: var(--text-primary);
	}

	.theme-section {
		background-color: var(--background-card);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1rem;
		box-shadow: 0 2px 8px var(--ui-shadow);
	}

	.theme-toggle-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.theme-label {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.theme-toggle-container {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		border-radius: 12px;
		padding: 0.5rem;
	}

	.theme-option {
		padding: 0.75rem;
		border-radius: 8px;
		text-align: center;
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--text-secondary);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background-color: var(--background-cardHover);
		border: none;
	}

	/* Base active style */
	.theme-option.active {
		box-shadow: 0 2px 4px var(--ui-shadow);
	}

	/* Light theme specific active style */
	.light-option.active {
		background: var(--background-button);
		color: var(--btn-text);
	}

	/* Dark and Cosmic theme active styles with gradients */
	.cosmic-option.active,
	.dark-option.active {
		background: var(--btn-bg);
		color: var(--btn-text);
	}

	.theme-option i {
		font-size: 1rem;
	}

	.update-button,
	.logout-button {
		width: 100%;
		padding: 0.9rem 1rem;
		border-radius: 12px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.update-button {
		background: var(--btn-bg);
		color: var(--btn-text);
		margin-bottom: 1rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
	}

	.update-button:hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--ui-shadowHover);
	}

	.logout-button {
		background-color: var(--background-card);
		color: var(--text-primary);
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.logout-button:hover {
		background-color: var(--background-cardHover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--ui-shadowHover);
	}

	.loading {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	@media (max-width: 480px) {
		.stats-strip {
			padding: 0.75rem 1rem;
		}

		.stat-item i {
			font-size: 1.25rem;
		}

		.stat-text h3 {
			font-size: 1.1rem;
		}

		.stat-text p {
			font-size: 0.7rem;
		}

		form,
		.theme-section {
			padding: 1rem;
		}

		input,
		select {
			font-size: 16px;
		}
	}
</style>
