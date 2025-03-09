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

	// Declare formResult with explicit type to fix TS lint errors.
	// 'error' indicates an error state with an associated message from the server.
	type FormResult = { type: 'error'; message: string } | null;
	let formResult: FormResult = null;

	let formElement: HTMLFormElement;

	// Compute button disabled state based on global generation state and form state
	$: buttonDisabled =
		$meditationGeneration.isGenerating || (activeTab === 'lesson' && !selectedPlaylist);

	// Button text and icon based on generation state
	$: buttonText = $meditationGeneration.isGenerating ? 'Generating...' : 'Generate Meditation';
	$: buttonIcon = $meditationGeneration.isGenerating ? 'fa-spinner fa-spin' : 'fa-paper-plane';

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
				return 'Writing your meditation script...';
			case 'Reviewing':
				return 'Reviewing your meditation script...';
			case 'Audio Generation':
				return 'Recording your meditation...';
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
									label: 'View',
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

	<div class="tabs" style="--option-count: 2;">
		<div
			class="slider-background"
			style="transform: translateX({activeTab === 'custom' ? '0%' : '100%'});"
		></div>
		<button on:click={() => (activeTab = 'custom')} class:active={activeTab === 'custom'}
			>Custom Session</button
		>
		<button on:click={() => (activeTab = 'lesson')} class:active={activeTab === 'lesson'}
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

	<!-- Form for generating meditation based on user input. Hidden inputs capture data such as the user's local time, desired duration, and additional parameters. The submission is handled by handleFormSubmit for dynamic updates without a full page refresh. -->
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
			<i class="fas {buttonIcon}"></i>
			<span>{buttonText}</span>
		</button>
	</form>

	<!-- Display server error messages if any -->
	{#if formResult?.type === 'error'}
		<p class="error">{formResult.message}</p>
	{/if}
</div>

<style>
	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.1);
	}

	.meditation-container {
		width: 100%;
		padding: 1.5rem 0;
	}

	/* Tabs */
	.tabs {
		display: flex;
		position: relative;
		margin-bottom: 1.5rem;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		backdrop-filter: blur(5px);
		box-shadow: 0 4px 15px var(--ui-shadow);
	}

	/* Slider background element for tabs */
	.tabs .slider-background {
		position: absolute;
		top: 0;
		left: 0;
		width: calc(100% / var(--option-count));
		height: 100%;
		background: var(--slider-bg);
		transition: transform 0.3s ease;
		z-index: 0;
		border-radius: 12px;
	}

	.tabs button {
		flex: 1;
		padding: 0.9rem 1rem;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: color 0.3s ease;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-secondary);
		font-family: 'Inter', sans-serif;
		position: relative;
		z-index: 1;
	}

	.tabs button.active {
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
		transition: transform 0.3s ease;
	}

	.select-wrapper:hover::after {
		transform: translateY(-50%) translateY(2px);
	}

	.playlist-selector select {
		width: 100%;
		padding: 0.9rem 1rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 12px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		font-size: 0.95rem;
		appearance: none;
		cursor: pointer;
		font-family: 'Inter', sans-serif;
		color: var(--text-primary);
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px var(--ui-shadow);
		backdrop-filter: blur(5px);
		background-color: var(--background-card);
	}

	.playlist-selector select:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	.playlist-selector select:focus {
		outline: none;
		border-color: rgba(var(--interactive-gradient-1), 0.3);
	}

	.playlist-selector select option {
		background-color: var(--background-card);
		color: var(--text-primary);
		padding: 0.5rem;
	}

	/* Style the first (placeholder) option differently */
	.playlist-selector select option:first-child {
		color: var(--text-secondary);
	}

	/* Ensure proper styling in Firefox */
	.playlist-selector select:-moz-focusring {
		color: transparent;
		text-shadow: 0 0 0 var(--text-primary);
	}

	/* Ensure proper styling in dark mode for Webkit */
	@media (prefers-color-scheme: dark) {
		.playlist-selector select option {
			background-color: var(--background-card);
		}
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
		margin-bottom: 0.75rem;
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
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 12px;
		overflow: hidden;
		position: relative;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px var(--ui-shadow);
		backdrop-filter: blur(5px);
	}

	.slider-background {
		position: absolute;
		top: 0;
		left: 0;
		width: calc(100% / var(--option-count));
		height: 100%;
		background: var(--slider-bg);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.option {
		flex: 1;
		padding: 0.9rem 0.25rem;
		text-align: center;
		cursor: pointer;
		position: relative;
		z-index: 1;
	}

	.option-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		transition: all 0.3s ease;
		color: var(--text-secondary);
	}

	.option-content.selected {
		color: var(--text-light);
		transform: scale(1.05);
	}

	.option i {
		display: block;
		font-size: 1.2rem;
		margin-bottom: 0.25rem;
		transition: transform 0.3s ease;
	}

	.option:hover i {
		transform: scale(1.1);
	}

	.option span {
		font-size: 0.8rem;
		font-weight: 500;
		white-space: nowrap;
	}

	/* Duration Slider */
	.duration-slider {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 12px;
		box-shadow: 0 4px 15px var(--ui-shadow);
		backdrop-filter: blur(5px);
	}

	.duration-slider label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.duration-value {
		font-weight: 600;
		color: var(--text-primary);
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.1) 0%,
			rgba(var(--interactive-gradient-2), 0.05) 100%
		);
		padding: 0.4rem 0.75rem;
		border-radius: 8px;
		font-size: 0.85rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.slider-container {
		position: relative;
		width: 100%;
		height: 30px;
		padding: 0 10px;
	}

	.slider-track {
		position: absolute;
		top: 50%;
		left: 10px;
		right: 10px;
		height: 8px;
		background: rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 4px;
		transform: translateY(-50%);
		pointer-events: none;
	}

	.slider-progress {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: var(--slider-progress-bg);
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

	.duration-slider input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: var(--background-card);
		border: 2px solid rgba(var(--interactive-gradient-1), 0.6);
		border-radius: 50%;
		cursor: pointer;
		margin-top: -4px;
		box-shadow: 0 2px 4px var(--ui-shadow);
		transition: all 0.3s ease;
	}

	.duration-slider input::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: var(--background-card);
		border: 2px solid rgba(var(--interactive-gradient-1), 0.6);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px var(--ui-shadow);
		transition: all 0.3s ease;
		margin-top: -4px;
	}

	.duration-slider input::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 8px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.8);
	}

	.duration-slider input::-moz-range-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 8px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.8);
	}

	/* Generate Button */
	.generate-btn {
		width: 100%;
		padding: 1rem;
		font-size: 0.95rem;
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.15);
		position: relative;
		overflow: hidden;
	}

	.generate-btn::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 50%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transform: skewX(-25deg);
		transition: all 0.75s ease;
	}

	.generate-btn:not(:disabled):hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(var(--interactive-gradient-1), 0.25);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
	}

	.generate-btn:not(:disabled):active {
		transform: translateY(1px);
		box-shadow: 0 2px 10px rgba(var(--interactive-gradient-1), 0.15);
	}

	.generate-btn:disabled {
		background: var(--ui-disabled);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
		border-color: transparent;
		opacity: 0.7;
		color: var(--text-secondary);
	}

	.generate-btn:disabled::after {
		display: none;
	}

	.generate-btn i {
		font-size: 1rem;
		transition: transform 0.3s ease;
	}

	.generate-btn:not(:disabled):hover i {
		transform: translateX(3px);
	}

	/* Error Message */
	.error {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 12px;
		background: var(--background-error);
		color: var(--text-error);
		font-size: 0.9rem;
		text-align: center;
		border: 1px solid rgba(var(--ui-danger), 0.2);
		box-shadow: 0 4px 15px rgba(var(--ui-danger), 0.1);
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

		.tabs button {
			padding: 0.75rem 0.5rem;
			font-size: 0.9rem;
		}

		.duration-slider {
			padding: 0.75rem;
		}

		.generate-btn {
			padding: 0.9rem;
			font-size: 0.95rem;
		}
	}
</style>
