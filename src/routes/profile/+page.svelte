<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';

	export let data: PageData;
	export let form: ActionData;

	// Initialize the profile from the loaded data
	let profile = data.profile;

	// Reactive statement to update profile when data or form changes
	$: {
		if (form?.type === 'success') {
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
	let showSuccessMessage = false;

	function handleSubmit(event: SubmitEvent) {
		showSuccessMessage = false;
	}

	function handleUpdateSuccess() {
		showSuccessMessage = true;
		setTimeout(() => {
			showSuccessMessage = false;
		}, 3000); // Hide the message after 3 seconds
	}
</script>

<div class="profile-container">
	{#if profile}
		<h1>Your Profile</h1>

		<div class="stats">
			<p>Minutes Listened: <span>{profile.minutes_listened}</span></p>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				return ({ result }) => {
					if (result.type === 'success') {
						handleUpdateSuccess();
					}
				};
			}}
			on:submit={handleSubmit}
			bind:this={formElement}
		>
			<div class="form-group">
				<label for="name">Name:</label>
				<input type="text" id="name" name="name" value={profile.name ?? ''} required />
			</div>
			<div class="form-group">
				<label for="experience">Experience Level:</label>
				<select id="experience" name="experience" required>
					<option value="beginner" selected={profile.experience === 'beginner'}>Beginner</option>
					<option value="intermediate" selected={profile.experience === 'intermediate'}
						>Intermediate</option
					>
					<option value="advanced" selected={profile.experience === 'advanced'}>Advanced</option>
				</select>
			</div>
			<div class="form-group">
				<label for="voice_id">Preferred Voice:</label>
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

		<br />
		<button class="logout-button" on:click={handleLogout}>Logout</button>

		{#if showSuccessMessage}
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
	h1 {
		font-family: 'Poppins', sans-serif;
		color: #333;
		margin-bottom: 1.5rem;
	}

	.stats {
		background-color: #e1e1e1;
		border: 1px solid #706b5780;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 6px #0000001a;
	}

	.stats p {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.stats span {
		font-weight: bold;
		color: #4caf50;
	}

	form {
		background-color: #e1e1e1; /* Changed from #E1E1E1 to a light gray */
		border: 1px solid #706b5780;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 4px 6px #0000001a;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #333;
	}

	input,
	select {
		width: 100%;
		padding: 0.5rem;
		background-color: #e1e1e1;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box; /* Added to prevent overflow */
	}

	.update-button,
	.logout-button {
		width: 100%;
		padding: 0.75rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.update-button {
		background-color: #4caf50;
		color: #e1e1e1;
		margin-bottom: 1rem;
	}

	.update-button:hover {
		background-color: #45a049;
	}

	.logout-button {
		background-color: #f44336;
		color: #e1e1e1;
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
		form {
			padding: 1rem;
		}

		input,
		select {
			font-size: 16px; /* Increased font size for better mobile readability */
		}
	}
</style>
