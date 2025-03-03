<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { subscribeMeditationStatus } from '$lib/api';
	import type { PageData } from './$types';
	import { onMount, onDestroy } from 'svelte';
	import { spring } from 'svelte/motion';
	import { text, background, ui, icon } from '$lib/theme';
	import { meditationGeneration } from '$lib/stores/meditationGeneration';
	import { showError, showLoading, notifications, showSuccess } from '$lib/stores/notifications';

	export let data: PageData;

	let activeTab: 'custom' | 'lesson' = data.initialTab as 'custom' | 'lesson';
	let selectedPlaylist = data.selectedPlaylist ? data.selectedPlaylist.id : '';
	let selectedLesson = '';

	interface CustomActionData {
		type: 'success' | 'error';
		status?: number;
		data?: string;
		message?: string;
	}

	let form: CustomActionData | null = null;
	let formElement: HTMLFormElement;

	// Compute button disabled state based on global generation state and form state
	$: buttonDisabled =
		$meditationGeneration.isGenerating || (activeTab === 'lesson' && !selectedPlaylist);

	let duration = 15;

	let postureOptions = [
		{ value: 'sitting', display: 'Sitting', icon: 'fa-chair' },
		{ value: 'lying', display: 'Lying', icon: 'fa-bed' },
		{ value: 'walking', display: 'Walking', icon: 'fa-walking' }
	];
	let eyesOptions = [
		{ value: 'open', display: 'Open', icon: 'fa-eye' },
		{ value: 'closed', display: 'Closed', icon: 'fa-eye-slash' }
	];
	let selectedPosture = postureOptions[0].value;
	let selectedEyes = eyesOptions[1].value;

	let postureSpring = spring(0);
	let eyesSpring = spring(0);

	let selectedPostureIndex = 0;
	let selectedEyesIndex = 1;

	$: {
		selectedPostureIndex = postureOptions.findIndex((option) => option.value === selectedPosture);
	}

	$: {
		selectedEyesIndex = eyesOptions.findIndex((option) => option.value === selectedEyes);
	}

	$: {
		postureSpring.set(selectedPostureIndex);
	}

	$: {
		eyesSpring.set(selectedEyesIndex);
	}

	$: isWalking = selectedPosture === postureOptions[2].value;

	$: {
		if (isWalking) {
			selectedEyes = eyesOptions[0].value; // Set to "Open" when walking
		}
	}

	function getUserLocalTime() {
		const time = new Intl.DateTimeFormat('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		})
			.format(new Date())
			.replace(/\s/g, '');
		return time;
	}

	function getStatusMessage(status: string): string {
		switch (status) {
			case 'Queued':
			case '':
				return 'Your meditation is in the queue...';
			case 'Fetching':
				return 'Fetching meditation details...';
			case 'Scripting':
				return 'Crafting your personalized meditation script...';
			case 'Reviewing':
				return 'Reviewing your meditation script...';
			case 'Audio Generation':
				return 'Generating your meditation audio...';
			case 'Processing':
				return 'Processing your meditation...';
			case 'Uploading':
				return 'Uploading your meditation...';
			case 'Saving':
				return 'Saving your meditation...';
			case 'Completed':
				return 'Your meditation is ready!';
			case 'Failed':
				return 'Meditation generation failed. Please try again.';
			default:
				return 'Starting your generation...';
		}
	}

	function handleMeditationStatus(status: string) {
		meditationGeneration.updateStatus(status);

		// Update the loading notification with the current status
		if ($meditationGeneration.isGenerating) {
			showLoading(getStatusMessage(status), {
				dismissible: false,
				autoClose: status === 'Completed' ? 0 : undefined
			});
		}

		if (status === 'Completed' && $meditationGeneration.meditationId) {
			const meditationId = $meditationGeneration.meditationId;
			notifications.clear(); // Clear all notifications
			meditationGeneration.reset();
			goto(`/session/${meditationId}`);
		} else if (status === 'Failed') {
			notifications.clear(); // Clear all notifications
			showError('Meditation generation failed. Please try again.');
			meditationGeneration.failGeneration();
		}
	}

	function createParametersJSON() {
		const params: any = {
			posture: selectedPosture,
			eyes: selectedEyes
		};
		if (activeTab === 'lesson') {
			params.playlist_id = selectedPlaylist;
		}
		return params;
	}

	async function handleFormSubmit(event: Event) {
		console.log('Client: handleFormSubmit called');
		event.preventDefault();

		const formData = new FormData(formElement);
		formData.set('userLocalTime', getUserLocalTime());
		formData.set('length', duration.toString());
		formData.set('parameters', JSON.stringify(createParametersJSON()));
		if (activeTab === 'lesson') {
			formData.set('playlist_id', selectedPlaylist);
		}

		console.log('Client: Form data:', Object.fromEntries(formData));

		try {
			const response = await fetch(formElement.action, {
				method: 'POST',
				body: formData
			});

			console.log('Client: Response status:', response.status);

			const result: CustomActionData = await response.json();
			console.log('Client: Result:', JSON.stringify(result, null, 2));

			if (result.type === 'success' && result.data) {
				let parsedData;
				try {
					parsedData = JSON.parse(result.data);
				} catch (e) {
					console.error('Failed to parse result.data:', e);
					throw new Error('Invalid data format');
				}

				const meditationId = parsedData[3]; // The meditation ID is the fourth element in the array
				if (typeof meditationId === 'string') {
					console.log('Client: Valid meditation ID:', meditationId);
					meditationGeneration.startGeneration(meditationId);
					const loadingNotificationId = showLoading('Starting your meditation generation...', {
						dismissible: false
					});

					// Subscribe to status updates
					const unsubscribe = subscribeMeditationStatus(meditationId, (status) => {
						meditationGeneration.updateStatus(status);

						// Update the loading notification with the current status
						if (status === 'Completed') {
							notifications.clear();
							showSuccess('Your meditation is ready!', {
								action: {
									label: 'View Meditation',
									onClick: () => {
										notifications.clear(); // Clear the notification when user clicks to view
										meditationGeneration.reset();
										goto(`/session/${meditationId}`);
									}
								},
								dismissible: false, // Remove close button since we have the action arrow
								autoClose: 0 // Ensure notification persists until clicked (0 means no auto-close)
							});
							meditationGeneration.completeGeneration();
							if (unsubscribe) unsubscribe();
						} else if (status === 'Failed') {
							notifications.clear();
							showError('Meditation generation failed. Please try again.');
							meditationGeneration.failGeneration();
							if (unsubscribe) unsubscribe();
						} else {
							// Update the existing notification instead of creating a new one
							notifications.update(loadingNotificationId, {
								message: getStatusMessage(status)
							});
						}
					});
				} else {
					throw new Error('Invalid server response. We might be offline.');
				}
			} else {
				throw new Error(result.message || 'Failed to generate meditation');
			}
		} catch (error: unknown) {
			console.error('Client: Error in handleFormSubmit:', error);
			showError(error instanceof Error ? error.message : 'An unexpected error occurred');
			meditationGeneration.failGeneration();
		}
	}

	onDestroy(() => {
		// No need to unsubscribe as the global state handles the subscription
	});
</script>

<svelte:head>
	<title>New Meditation</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="meditation-container">
	<h1>New Meditation</h1>

	<div class="tabs">
		<button class:active={activeTab === 'custom'} on:click={() => (activeTab = 'custom')}
			>Custom Session</button
		>
		<button class:active={activeTab === 'lesson'} on:click={() => (activeTab = 'lesson')}
			>Lesson</button
		>
	</div>

	{#if activeTab === 'lesson'}
		<div class="playlist-selector">
			<label for="playlist-select">Select a playlist:</label>
			<div class="select-wrapper">
				<select id="playlist-select" bind:value={selectedPlaylist}>
					<option value="">Choose a playlist</option>
					{#each data.playlists as playlist}
						<option value={playlist.id}>{playlist.playlist_name}</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}

	<div class="options-container">
		<div class="option-group">
			<div class="option-header">
				<h3>Posture</h3>
			</div>
			<div class="sliding-checkbox" style="--option-count: {postureOptions.length};">
				<div
					class="slider-background"
					style="transform: translateX({100 * selectedPostureIndex}%)"
				></div>
				{#each postureOptions as posture, i}
					<label class="option">
						<input
							type="radio"
							name="posture"
							value={posture.value}
							bind:group={selectedPosture}
							hidden
						/>
						<div class="option-content" class:selected={i === selectedPostureIndex}>
							<i class="fas {posture.icon}"></i>
							<span>{posture.display}</span>
						</div>
					</label>
				{/each}
			</div>
		</div>
		<div class="option-group">
			<div class="option-header">
				<h3>Eyes</h3>
				{#if isWalking}
					<span class="option-note">Auto-set to open when walking</span>
				{/if}
			</div>
			<div
				class="sliding-checkbox"
				style="--option-count: {eyesOptions.length}; opacity: {isWalking ? 0.5 : 1};"
			>
				<div
					class="slider-background"
					style="transform: translateX({100 * selectedEyesIndex}%)"
				></div>
				{#each eyesOptions as eye, i}
					<label class="option">
						<input
							type="radio"
							name="eyes"
							value={eye.value}
							bind:group={selectedEyes}
							disabled={isWalking}
							hidden
						/>
						<div class="option-content" class:selected={i === selectedEyesIndex}>
							<i class="fas {eye.icon}"></i>
							<span>{eye.display}</span>
						</div>
					</label>
				{/each}
			</div>
		</div>
	</div>

	<div class="duration-slider">
		<label for="duration">
			<span class="label-text">Duration:</span>
			<span class="duration-value">{duration} minutes</span>
		</label>
		<div class="slider-container">
			<div class="slider-track">
				<div class="slider-progress" style="width: {((duration - 10) / 35) * 100}%"></div>
			</div>
			<input type="range" id="duration" name="duration" min="10" max="45" bind:value={duration} />
		</div>
	</div>

	<form
		bind:this={formElement}
		method="POST"
		action="?/generateMeditation"
		on:submit={handleFormSubmit}
	>
		<input type="hidden" name="userLocalTime" value={getUserLocalTime()} />
		<input type="hidden" name="length" value={duration} />
		<input type="hidden" name="parameters" value={JSON.stringify(createParametersJSON())} />
		{#if activeTab === 'lesson'}
			<input type="hidden" name="playlist_id" value={selectedPlaylist} />
		{/if}
		<button
			type="submit"
			class="generate-btn"
			disabled={buttonDisabled || (activeTab === 'lesson' && !selectedPlaylist)}
		>
			<i class="fas fa-paper-plane"></i>
			<span>Generate Meditation</span>
		</button>
	</form>

	{#if form?.type === 'error'}
		<p class="error">{form.message}</p>
	{/if}
</div>

<style>
	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
	}

	.meditation-container {
		width: 100%;
		padding: 1.5rem 0;
	}

	/* Tabs */
	.tabs {
		display: flex;
		margin-bottom: 1.5rem;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background-color: var(--background-card);
	}

	.tabs button {
		flex: 1;
		padding: 0.75rem 1rem;
		border: none;
		background-color: var(--background-card);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-secondary);
		font-family: 'Inter', sans-serif;
	}

	.tabs button.active {
		background-color: var(--background-button);
		color: var(--text-light);
	}

	/* Playlist Selector */
	.playlist-selector {
		margin-bottom: 1.5rem;
	}

	.playlist-selector label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		font-size: 0.9rem;
		color: var(--text-secondary);
	}

	.select-wrapper {
		position: relative;
	}

	.select-wrapper::after {
		content: '\25BC';
		position: absolute;
		top: 50%;
		right: 1rem;
		transform: translateY(-50%);
		pointer-events: none;
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.playlist-selector select {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		background-color: var(--background-cardHover);
		font-size: 0.95rem;
		appearance: none;
		cursor: pointer;
		font-family: 'Inter', sans-serif;
		color: var(--text-primary);
	}

	.playlist-selector select:focus {
		outline: none;
		border-color: var(--text-primary);
	}

	/* Options Container */
	.options-container {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.option-group {
		flex: 1;
	}

	.option-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.option-note {
		font-size: 0.7rem;
		color: var(--text-secondary);
		font-style: italic;
	}

	.option-group h3 {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.sliding-checkbox {
		display: flex;
		background-color: var(--background-cardHover);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		overflow: hidden;
		position: relative;
		transition: opacity 0.3s ease;
	}

	.slider-background {
		position: absolute;
		top: 0;
		left: 0;
		width: calc(100% / var(--option-count));
		height: 100%;
		background-color: var(--background-button);
		transition: transform 0.3s ease;
	}

	.option {
		flex: 1;
		padding: 0.75rem 0.25rem;
		text-align: center;
		cursor: pointer;
		position: relative;
		z-index: 1;
	}

	.option-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		transition: color 0.3s ease;
		color: var(--text-secondary);
	}

	.option-content.selected {
		color: var(--text-light);
	}

	.option i {
		display: block;
		font-size: 1.2rem;
		margin-bottom: 0.25rem;
	}

	.option span {
		font-size: 0.8rem;
		font-weight: 500;
		white-space: nowrap;
	}

	/* Duration Slider */
	.duration-slider {
		margin-bottom: 1.5rem;
	}

	.duration-slider label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.duration-value {
		font-weight: 600;
		color: var(--text-primary);
		background: var(--background-cardHover);
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
		font-size: 0.85rem;
	}

	.slider-container {
		position: relative;
		width: 100%;
		height: 30px;
	}

	.slider-track {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 8px;
		background: var(--background-cardHover);
		border-radius: 4px;
		transform: translateY(-50%);
		pointer-events: none;
	}

	.slider-progress {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: var(--background-button);
		border-radius: 4px;
		pointer-events: none;
	}

	.duration-slider input {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 30px;
		background: transparent;
		outline: none;
		margin: 0;
		padding: 0;
		cursor: pointer;
		position: relative;
		z-index: 1;
	}

	.duration-slider input::-webkit-slider-runnable-track {
		width: 100%;
		height: 8px;
		background: transparent;
		border-radius: 4px;
		cursor: pointer;
	}

	.duration-slider input::-moz-range-track {
		width: 100%;
		height: 8px;
		background: transparent;
		border-radius: 4px;
		cursor: pointer;
	}

	.duration-slider input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: var(--background-card);
		border: 2px solid var(--text-primary);
		border-radius: 50%;
		cursor: pointer;
		margin-top: -6px;
		box-shadow: 0 2px 4px var(--ui-shadow);
	}

	.duration-slider input::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: var(--background-card);
		border: 2px solid var(--text-primary);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px var(--ui-shadow);
	}

	/* Generate Button */
	.generate-btn {
		width: 100%;
		padding: 0.9rem 1rem;
		font-size: 1rem;
		background-color: var(--background-button);
		color: var(--text-light);
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		box-shadow: 0 4px 10px var(--ui-shadow);
	}

	.generate-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	.generate-btn:active {
		transform: translateY(1px);
		box-shadow: 0 2px 5px var(--ui-shadow);
	}

	.generate-btn:disabled {
		background-color: var(--ui-disabled);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.generate-btn i {
		font-size: 1rem;
	}

	/* Status Messages */
	.generating-message {
		margin-top: 1rem;
		padding: 0.75rem;
		font-size: 0.9rem;
		color: var(--text-secondary);
		text-align: center;
	}

	.generating-message i {
		color: var(--text-primary);
	}

	.error {
		color: #e53935;
		margin-top: 1rem;
		padding: 0.75rem;
		background-color: rgba(229, 57, 53, 0.1);
		border-radius: 12px;
		font-size: 0.9rem;
		text-align: center;
	}

	@media (max-width: 480px) {
		.options-container {
			flex-direction: column;
		}

		.meditation-container {
			padding: 1rem 0;
		}

		h1 {
			font-size: 1.6rem;
			margin-bottom: 1.2rem;
		}
	}
</style>
