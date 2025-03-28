<script lang="ts">
	import type { PageData } from './$types';
	import { invalidate } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { theme, setTheme } from '$lib/stores/theme';
	import { showSuccess, showError } from '$lib/stores/notifications';
	import { updateUserProfile, updateUserTheme } from '$lib/api';

	export let data: PageData;

	// Initialize the profile from the loaded data
	let profile = data.profile;

	// Security section state
	let securitySectionOpen = false;
	let newEmail = '';
	let currentPassword = '';
	let newPassword = '';
	let confirmNewPassword = '';
	let isChangingEmail = false;
	let isChangingPassword = false;

	const voiceOptions = [
		{ id: 0, label: 'Female 1', audioSrc: '/audio/female1-sample.mp3' },
		{ id: 1, label: 'Female 2', audioSrc: '/audio/female2-sample.mp3' },
		{ id: 4, label: 'Female 3', audioSrc: '/audio/female3-sample.mp3' },
		{ id: 2, label: 'Male 1', audioSrc: '/audio/male1-sample.mp3' },
		{ id: 3, label: 'Male 2', audioSrc: '/audio/male2-sample.mp3' }
	];

	// Audio player references
	let audioPlayers: { [key: number]: HTMLAudioElement } = {};
	let currentlyPlaying: number | null = null;

	function playVoiceSample(voiceId: number) {
		// Stop any currently playing audio
		if (currentlyPlaying !== null && currentlyPlaying !== voiceId) {
			audioPlayers[currentlyPlaying].pause();
			audioPlayers[currentlyPlaying].currentTime = 0;
		}

		// Play the selected voice sample
		if (audioPlayers[voiceId]) {
			if (currentlyPlaying === voiceId && !audioPlayers[voiceId].paused) {
				// If clicking the same voice that's already playing, pause it
				audioPlayers[voiceId].pause();
				audioPlayers[voiceId].currentTime = 0;
				currentlyPlaying = null;
			} else {
				// Play the selected voice
				audioPlayers[voiceId].play();
				currentlyPlaying = voiceId;
			}
		}
	}

	// Handle audio ended event
	function handleAudioEnded(voiceId: number) {
		if (currentlyPlaying === voiceId) {
			currentlyPlaying = null;
		}
	}

	// Load audio elements after the component mounts
	import { onMount } from 'svelte';

	onMount(() => {
		// Initialize audio players
		voiceOptions.forEach((voice) => {
			const audio = new Audio(voice.audioSrc);
			audio.addEventListener('ended', () => handleAudioEnded(voice.id));
			audioPlayers[voice.id] = audio;
		});

		return () => {
			// Cleanup audio players on component unmount
			Object.values(audioPlayers).forEach((player) => {
				player.pause();
				player.src = '';
			});
		};
	});

	async function handleLogout() {
		const { error } = await supabase.auth.signOut({ scope: 'local' });
		if (!error) {
			await invalidate('supabase:auth');
			window.location.href = '/';
		}
	}

	let formElement: HTMLFormElement;
	let isSubmitting = false;
	let name = profile?.name || '';
	let experience = profile?.experience || 'beginner';
	let voice_id = profile?.voice_id || 0;

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!data.session?.user?.id) {
			showError('User session not found. Please log in again.');
			return;
		}

		isSubmitting = true;

		try {
			const updatedProfile = await updateUserProfile(data.session.user.id, {
				name,
				experience,
				voice_id
			});

			profile = updatedProfile;
			handleUpdateSuccess();
		} catch (err) {
			console.error('Error updating profile:', err);
			showError('Failed to update profile. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	function handleUpdateSuccess() {
		showSuccess('Profile updated successfully!');
	}

	async function handleThemeChange(newTheme: 'gem' | 'galaxy') {
		if (!data.session?.user?.id) {
			showError('User session not found. Please try again.');
			return;
		}

		try {
			// Update theme in the store for immediate UI feedback
			setTheme(newTheme);

			// Update in the database
			await updateUserTheme(data.session.user.id, newTheme);
			console.log('Theme updated in database');
			showSuccess(`Theme changed to ${newTheme}`);
		} catch (err) {
			console.error('Error updating theme:', err);
			showError('Failed to update theme. Please try again.');
		}
	}

	async function handleEmailChange() {
		if (!newEmail) {
			showError('Please enter a new email address');
			return;
		}

		if (!currentPassword) {
			showError('Please enter your current password to confirm email change');
			return;
		}

		isChangingEmail = true;

		try {
			const { error } = await supabase.auth.updateUser(
				{
					email: newEmail
				},
				{
					emailRedirectTo: `${window.location.origin}/auth/callback`
				}
			);

			if (error) throw error;

			showSuccess(
				'Verification email sent. You must verify both your old and new email addresses before the change takes effect.'
			);
			newEmail = '';
			currentPassword = '';
		} catch (err) {
			console.error('Error changing email:', err);
			showError('Failed to update email. Please try again.');
		} finally {
			isChangingEmail = false;
		}
	}

	async function handlePasswordChange() {
		if (!currentPassword) {
			showError('Please enter your current password');
			return;
		}

		if (!newPassword) {
			showError('Please enter a new password');
			return;
		}

		if (newPassword !== confirmNewPassword) {
			showError('New passwords do not match');
			return;
		}

		if (newPassword.length < 6) {
			showError('New password must be at least 6 characters');
			return;
		}

		isChangingPassword = true;

		try {
			const { error } = await supabase.auth.updateUser({
				password: newPassword
			});

			if (error) throw error;

			showSuccess('Password updated successfully');
			currentPassword = '';
			newPassword = '';
			confirmNewPassword = '';
		} catch (err) {
			console.error('Error changing password:', err);
			showError('Failed to update password. Please try again.');
		} finally {
			isChangingPassword = false;
		}
	}

	function toggleSecuritySection() {
		securitySectionOpen = !securitySectionOpen;
	}
</script>

<svelte:head>
	<title>Profile</title>
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

		<form on:submit={handleSubmit} bind:this={formElement}>
			<div class="form-group">
				<label for="name">Name</label>
				<input type="text" id="name" bind:value={name} />
			</div>
			<div class="form-group">
				<label for="experience">Experience Level</label>
				<select id="experience" bind:value={experience} required>
					<option value="beginner">Beginner</option>
					<option value="intermediate">Intermediate</option>
					<option value="advanced">Advanced</option>
				</select>
			</div>
			<div class="form-group">
				<label for="voice_id">Voice (effects new sessions only)</label>
				<div class="voice-selection-container">
					<div class="voice-preview-options">
						{#each voiceOptions as option}
							<div
								class="voice-option-card {voice_id === option.id ? 'selected' : ''}"
								on:click={() => {
									voice_id = option.id;
								}}
							>
								<div class="voice-content">
									<div class="voice-info">
										<span class="voice-label">{option.label}</span>
										{#if voice_id === option.id}
											<i class="fas fa-check selection-indicator"></i>
										{/if}
									</div>
									<button
										type="button"
										class="voice-play-button {currentlyPlaying === option.id ? 'playing' : ''}"
										on:click={(e) => {
											e.stopPropagation();
											playVoiceSample(option.id);
										}}
										title="Preview {option.label}"
									>
										<i class="fas {currentlyPlaying === option.id ? 'fa-stop' : 'fa-play'}"></i>
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
			<button type="submit" class="update-button" disabled={isSubmitting}>
				{#if isSubmitting}
					<i class="fas fa-spinner fa-spin"></i> Saving...
				{:else}
					Save Changes
				{/if}
			</button>
		</form>

		<div class="theme-section">
			<h2>Appearance</h2>
			<div class="theme-toggle-wrapper">
				<span class="theme-label">Theme</span>
				<div class="theme-toggle-container">
					<button
						class="theme-option galaxy-option {$theme === 'galaxy' ? 'active' : ''}"
						on:click={() => handleThemeChange('galaxy')}
					>
						<i class="fas fa-galaxy {$theme === 'galaxy' ? 'spin-animation' : ''}"></i>
						Galaxy
					</button>
					<button
						class="theme-option gem-option {$theme === 'gem' ? 'active' : ''}"
						on:click={() => handleThemeChange('gem')}
					>
						<i class="fas fa-gem {$theme === 'gem' ? 'rock-animation' : ''}"></i>
						Gem
					</button>
				</div>
			</div>
		</div>

		<!-- New security section -->
		<div class="security-section">
			<button class="section-toggle" on:click={toggleSecuritySection}>
				<h2>Security</h2>
				<i class="fas fa-chevron-{securitySectionOpen ? 'up' : 'down'}"></i>
			</button>

			{#if securitySectionOpen}
				<div class="security-content">
					<div class="security-card">
						<h3>Change Email Address</h3>
						<div class="current-value">
							<span class="label">Current Email:</span>
							<span class="value">{data.session?.user?.email || 'Not available'}</span>
						</div>
						<div class="form-group">
							<label for="newEmail">New Email Address</label>
							<input type="email" id="newEmail" bind:value={newEmail} />
						</div>
						<div class="form-group">
							<label for="currentPasswordEmail">Current Password</label>
							<input type="password" id="currentPasswordEmail" bind:value={currentPassword} />
						</div>
						<button class="security-button" on:click={handleEmailChange} disabled={isChangingEmail}>
							{#if isChangingEmail}
								<i class="fas fa-spinner fa-spin"></i> Sending Verification...
							{:else}
								Change Email
							{/if}
						</button>
						<p class="security-note">
							Note: You'll need to verify both your old and new email addresses before the change
							takes effect.
						</p>
					</div>

					<div class="security-card">
						<h3>Change Password</h3>
						<div class="form-group">
							<label for="currentPassword">Current Password</label>
							<input type="password" id="currentPassword" bind:value={currentPassword} />
						</div>
						<div class="form-group">
							<label for="newPassword">New Password</label>
							<input type="password" id="newPassword" bind:value={newPassword} />
						</div>
						<div class="form-group">
							<label for="confirmNewPassword">Confirm New Password</label>
							<input type="password" id="confirmNewPassword" bind:value={confirmNewPassword} />
						</div>
						<button
							class="security-button"
							on:click={handlePasswordChange}
							disabled={isChangingPassword}
						>
							{#if isChangingPassword}
								<i class="fas fa-spinner fa-spin"></i> Updating...
							{:else}
								Change Password
							{/if}
						</button>
					</div>
				</div>
			{/if}
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
		grid-template-columns: repeat(2, 1fr);
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

	/* gem and galaxy theme active styles with gradients */
	.galaxy-option.active,
	.gem-option.active {
		background: var(--btn-bg);
		color: var(--btn-text);
	}

	.theme-option i {
		font-size: 1rem;
	}

	/* Icon animations */
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes rock {
		0% {
			transform: rotate(-10deg);
		}
		50% {
			transform: rotate(10deg);
		}
		100% {
			transform: rotate(-10deg);
		}
	}

	.spin-animation {
		animation: spin 8s linear infinite;
	}

	.rock-animation {
		animation: rock 2s ease-in-out infinite;
		transform-origin: center;
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

	.voice-selection-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.voice-preview-options {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.voice-option-card {
		position: relative;
		border-radius: 10px;
		background-color: var(--background-cardHover);
		border: 1px solid var(--ui-border);
		transition:
			background 0.2s ease,
			color 0.2s ease;
		overflow: hidden;
		cursor: pointer;
	}

	.voice-option-card.selected {
		background: var(--btn-bg);
	}

	.voice-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
	}

	.voice-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.voice-label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary);
		transition: color 0.2s ease;
	}

	.selected .voice-label {
		color: var(--btn-text);
	}

	.selection-indicator {
		color: var(--btn-text);
		font-size: 0.75rem;
	}

	.voice-play-button {
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--play-btn-bg);
		color: var(--play-btn-text);
		border: none;
		border-radius: 50%;
		cursor: pointer;
		transition: background 0.2s ease;
		flex-shrink: 0;
	}

	.voice-play-button:hover {
		background: var(--play-btn-bg-hover);
	}

	.voice-play-button.playing {
		background: var(--play-btn-bg-hover);
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

	/* Security section styles */
	.security-section {
		background-color: var(--background-card);
		border-radius: 12px;
		margin-bottom: 1rem;
		box-shadow: 0 2px 8px var(--ui-shadow);
		overflow: hidden;
	}

	.section-toggle {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background-color 0.2s ease;
	}

	.section-toggle h2 {
		margin: 0;
		font-size: 1.3rem;
		color: var(--text-primary);
	}

	.section-toggle i {
		font-size: 1rem;
		color: var(--text-secondary);
		transition: transform 0.3s ease;
	}

	.security-content {
		padding: 0 1.5rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.security-card h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		font-size: 1.1rem;
		color: var(--text-primary);
		font-family: 'Space Grotesk', sans-serif;
	}

	.security-button {
		width: 100%;
		padding: 0.8rem 1rem;
		border-radius: 8px;
		font-size: 0.95rem;
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		cursor: pointer;
		transition: all 0.3s ease;
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.security-button:hover:not(:disabled) {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--ui-shadowHover);
	}

	.security-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.security-note,
	.current-value {
		margin-top: 0.75rem;
		font-size: 0.8rem;
		color: var(--text-secondary);
		font-style: italic;
	}

	@media (max-width: 480px) {
		.section-toggle {
			padding: 1rem;
		}

		.security-content {
			padding: 0 1rem 1rem;
		}

		.security-card {
			padding: 1rem;
		}
	}
</style>
