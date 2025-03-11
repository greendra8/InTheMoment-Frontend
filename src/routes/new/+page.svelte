<script lang="ts">
	import { goto } from '$app/navigation';
	import { subscribeMeditationStatus } from '$lib/api';
	import { onDestroy } from 'svelte';
	import { text, background, ui, icon } from '$lib/theme';
	import { meditationGeneration } from '$lib/stores/meditationGeneration';
	import { showError, showLoading, notifications, showSuccess } from '$lib/stores/notifications';

	// Define the CustomActionData type for form submission results
	type CustomActionData = {
		type: 'success' | 'error';
		message?: string;
		data?: any;
		status?: number;
	};

	export let data;

	// Session type selection
	let sessionType: 'meditation' | 'hypnosis' = 'meditation';

	// Meditation specific options
	let selectedPlaylist = data.selectedPlaylist ? data.selectedPlaylist.id : '';
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

	// Hypnosis specific options
	let hypnosisPrompt = '';

	// Common options
	let duration = 15;
	let formResult: CustomActionData | null = null;
	let formElement: HTMLFormElement;

	// Compute button disabled state based on global generation state and form state
	$: buttonDisabled =
		$meditationGeneration.isGenerating || (sessionType === 'hypnosis' && !hypnosisPrompt.trim());

	// Button text and icon based on generation state
	$: buttonText = $meditationGeneration.isGenerating
		? 'Generating...'
		: `Generate ${sessionType === 'meditation' ? 'Meditation' : 'Hypnosis'}`;
	$: buttonIcon = $meditationGeneration.isGenerating ? 'fa-spinner fa-spin' : 'fa-paper-plane';

	// Auto-set posture and eyes for hypnosis
	$: {
		if (sessionType === 'hypnosis') {
			selectedPosture = 'lying';
			selectedEyes = 'closed';
		}
	}

	// Handle walking posture (eyes must be open)
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
				return 'Your session is in the queue...';
			case 'Fetching':
				return 'Fetching session details...';
			case 'Scripting':
				return `Writing your ${sessionType} script...`;
			case 'Reviewing':
				return `Reviewing your ${sessionType} script...`;
			case 'Audio Generation':
				return `Recording your ${sessionType}...`;
			case 'Processing':
				return `Processing your ${sessionType}...`;
			case 'Uploading':
				return `Uploading your ${sessionType}...`;
			case 'Saving':
				return `Saving your ${sessionType}...`;
			case 'Completed':
				return `Your ${sessionType} is ready!`;
			case 'Failed':
				return `${sessionType} generation failed. Please try again.`;
			default:
				return 'Starting your generation...';
		}
	}

	function createParametersJSON() {
		const params: any = {
			posture: selectedPosture,
			eyes: selectedEyes
		};

		if (sessionType === 'hypnosis' && hypnosisPrompt) {
			params.prompt = hypnosisPrompt.trim();
		} else if (sessionType === 'meditation' && selectedPlaylist) {
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

		// Create parameters JSON with appropriate format for the session type
		const parameters = createParametersJSON();
		console.log('Client: Parameters:', parameters);
		formData.set('parameters', JSON.stringify(parameters));

		// Set content type (meditation or hypnosis)
		formData.set('content_type', sessionType);

		// For meditation with playlist, also set playlist_id at the top level
		if (sessionType === 'meditation' && selectedPlaylist) {
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

			if (result.type === 'success') {
				let meditationId;

				// Handle different response formats
				if (typeof result.data === 'string') {
					try {
						const parsedData = JSON.parse(result.data);
						console.log('Client: Parsed data:', parsedData);

						// Handle array format with nested JSON
						if (Array.isArray(parsedData)) {
							// Check if the meditation ID is in the 4th element (index 3)
							if (parsedData.length >= 4 && typeof parsedData[3] === 'string') {
								meditationId = parsedData[3];
							}
							// Check if the meditation ID is in a stringified JSON in the 3rd element (index 2)
							else if (parsedData.length >= 3 && typeof parsedData[2] === 'string') {
								try {
									// Try to parse the 3rd element as JSON
									const nestedJson = JSON.parse(parsedData[2]);
									if (nestedJson && nestedJson.meditation_id) {
										meditationId = nestedJson.meditation_id;
									}
								} catch (e) {
									console.error('Failed to parse nested JSON:', e);
								}
							}
						}
						// Handle direct object format
						else if (parsedData.meditation_id) {
							meditationId = parsedData.meditation_id;
						}
					} catch (e) {
						console.error('Failed to parse result.data string:', e);
					}
				} else if (result.data && typeof result.data === 'object') {
					// Handle direct object format
					if (result.data.meditation_id) {
						meditationId = result.data.meditation_id;
					}
				}

				console.log('Client: Extracted meditation ID:', meditationId);

				if (meditationId) {
					console.log('Client: Valid meditation ID:', meditationId);
					meditationGeneration.startGeneration(meditationId);
					const loadingNotificationId = showLoading('Starting your session generation...', {
						dismissible: false
					});

					// Subscribe to status updates
					const unsubscribe = subscribeMeditationStatus(meditationId, (status) => {
						meditationGeneration.updateStatus(status);

						// Update the loading notification with the current status
						if (status === 'Completed') {
							notifications.clear();
							showSuccess(`Your ${sessionType} is ready!`, {
								action: {
									label: 'View',
									onClick: () => {
										notifications.clear();
										meditationGeneration.reset();
										goto(`/session/${meditationId}`);
									}
								},
								dismissible: false,
								autoClose: 0
							});
							meditationGeneration.completeGeneration();
							if (unsubscribe) unsubscribe();
						} else if (status === 'Failed') {
							notifications.clear();
							showError(`${sessionType} generation failed. Please try again.`);
							meditationGeneration.failGeneration();
							if (unsubscribe) unsubscribe();
						} else {
							// Update the existing notification
							notifications.update(loadingNotificationId, {
								message: getStatusMessage(status)
							});
						}
					});
				} else {
					throw new Error('Could not find meditation ID in the response');
				}
			} else {
				throw new Error(result.message || `Failed to generate ${sessionType}`);
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
	<title>New Session | In The Moment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="session-container">
	<h1>New Session</h1>

	<div class="session-card">
		<!-- Session Type Selection -->
		<div class="session-type-selector">
			<button
				class:active={sessionType === 'meditation'}
				on:click={() => (sessionType = 'meditation')}
				class="meditation-btn"
			>
				Meditation
			</button>
			<button
				class:active={sessionType === 'hypnosis'}
				on:click={() => (sessionType = 'hypnosis')}
				class="hypnosis-btn"
			>
				Hypnosis
			</button>
		</div>

		<!-- Form for session generation -->
		<form
			bind:this={formElement}
			method="POST"
			action="?/generateMeditation"
			on:submit={handleFormSubmit}
			class="session-form"
		>
			<!-- Hidden inputs for form data -->
			<input type="hidden" name="userLocalTime" value={getUserLocalTime()} />
			<input type="hidden" name="length" value={duration} />
			<input type="hidden" name="parameters" value={JSON.stringify(createParametersJSON())} />
			<input type="hidden" name="content_type" value={sessionType} />
			{#if sessionType === 'meditation' && selectedPlaylist}
				<input type="hidden" name="playlist_id" value={selectedPlaylist} />
			{/if}

			<!-- Session options based on type -->
			<div class="session-options">
				{#if sessionType === 'meditation'}
					<!-- Playlist selection for meditation -->
					<div class="option-group playlist-group">
						<label for="playlist-select">Playlist (Optional)</label>
						<div class="playlist-selector">
							<select id="playlist-select" bind:value={selectedPlaylist}>
								<option value="">No playlist - Custom meditation</option>
								{#each data.playlists as playlist}
									<option value={playlist.id}>{playlist.playlist_name}</option>
								{/each}
							</select>
							<div class="select-icon">
								<i class="fas fa-chevron-down"></i>
							</div>
						</div>
					</div>
				{:else}
					<!-- Hypnosis prompt -->
					<div class="option-group prompt-group">
						<label for="hypnosis-prompt">What would you like to focus on?</label>
						<div class="prompt-input">
							<textarea
								id="hypnosis-prompt"
								placeholder="Describe what you'd like to achieve with this hypnosis session..."
								bind:value={hypnosisPrompt}
								rows="3"
							></textarea>
							<div class="prompt-info">
								<i class="fas fa-info-circle"></i>
								<span>Be as detailed as possible for a tailored experience.</span>
							</div>
						</div>
					</div>
				{/if}

				<!-- Common option: Duration -->
				<div class="option-group duration-group">
					<div class="duration-header">
						<label for="duration">Duration</label>
						<div class="duration-badge">{duration} min</div>
					</div>
					<div class="slider-container">
						<div class="slider-track">
							<div class="slider-progress" style="width: {((duration - 5) / 40) * 100}%"></div>
						</div>
						<input
							type="range"
							id="duration"
							name="duration"
							min="5"
							max="45"
							step="5"
							bind:value={duration}
						/>
					</div>
				</div>

				{#if sessionType === 'meditation'}
					<!-- Meditation-specific options -->
					<div class="option-group posture-group">
						<div class="option-header">
							<label>Posture</label>
							<div class="cycle-selector">
								<button
									type="button"
									class="cycle-btn prev"
									on:click={() => {
										const currentIndex = postureOptions.findIndex(
											(p) => p.value === selectedPosture
										);
										const prevIndex =
											(currentIndex - 1 + postureOptions.length) % postureOptions.length;
										selectedPosture = postureOptions[prevIndex].value;
									}}
								>
									<i class="fas fa-chevron-left"></i>
								</button>
								<div class="cycle-display">
									<i class="fas {postureOptions.find((p) => p.value === selectedPosture)?.icon}"
									></i>
									<span>{postureOptions.find((p) => p.value === selectedPosture)?.display}</span>
								</div>
								<button
									type="button"
									class="cycle-btn next"
									on:click={() => {
										const currentIndex = postureOptions.findIndex(
											(p) => p.value === selectedPosture
										);
										const nextIndex = (currentIndex + 1) % postureOptions.length;
										selectedPosture = postureOptions[nextIndex].value;
									}}
								>
									<i class="fas fa-chevron-right"></i>
								</button>
							</div>
						</div>
					</div>

					<div class="option-group eyes-group" class:disabled={isWalking}>
						<div class="option-header">
							<label>
								Eyes
								{#if isWalking}
									<span class="option-note">(Auto-set to open when walking)</span>
								{/if}
							</label>
							<div class="cycle-selector">
								<button
									type="button"
									class="cycle-btn prev"
									on:click={() => {
										if (!isWalking) {
											const currentIndex = eyesOptions.findIndex((e) => e.value === selectedEyes);
											const prevIndex =
												(currentIndex - 1 + eyesOptions.length) % eyesOptions.length;
											selectedEyes = eyesOptions[prevIndex].value;
										}
									}}
									disabled={isWalking}
								>
									<i class="fas fa-chevron-left"></i>
								</button>
								<div class="cycle-display">
									<i class="fas {eyesOptions.find((e) => e.value === selectedEyes)?.icon}"></i>
									<span>{eyesOptions.find((e) => e.value === selectedEyes)?.display}</span>
								</div>
								<button
									type="button"
									class="cycle-btn next"
									on:click={() => {
										if (!isWalking) {
											const currentIndex = eyesOptions.findIndex((e) => e.value === selectedEyes);
											const nextIndex = (currentIndex + 1) % eyesOptions.length;
											selectedEyes = eyesOptions[nextIndex].value;
										}
									}}
									disabled={isWalking}
								>
									<i class="fas fa-chevron-right"></i>
								</button>
							</div>
						</div>
					</div>
				{:else}
					<!-- Hypnosis settings info -->
					<div class="option-group settings-group">
						<label>Session Settings</label>
						<div class="settings-details">
							<div class="setting-item">
								<i class="fas fa-bed"></i>
								<span>Posture: Lying down</span>
							</div>
							<div class="setting-item">
								<i class="fas fa-eye-slash"></i>
								<span>Eyes: Closed</span>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Submit button -->
			<button type="submit" class="generate-btn" disabled={buttonDisabled}>
				<i class="fas {buttonIcon}"></i>
				<span>{buttonText}</span>
			</button>

			<!-- Error message display -->
			{#if formResult && formResult.type === 'error'}
				<div class="error-message">
					<i class="fas fa-exclamation-circle"></i>
					<p>{formResult.message || 'An error occurred'}</p>
				</div>
			{/if}
		</form>
	</div>
</div>

<style>
	/* Main container */
	.session-container {
		width: 100%;
		max-width: 800px;
		padding-top: 1.5rem;
		margin: 0 auto;
	}

	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.1);
	}

	.session-card {
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 8px 20px var(--ui-shadow);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		backdrop-filter: blur(5px);
	}

	/* Session Type Selector */
	.session-type-selector {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.session-type-selector button {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-secondary);
		font-family: 'Inter', sans-serif;
	}

	.session-type-selector button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 10px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
	}

	.session-type-selector button.meditation-btn.active {
		background: var(--meditation-badge-bg);
		color: var(--meditation-badge-text);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
	}

	.session-type-selector button.hypnosis-btn.active {
		background: var(--hypnosis-badge-bg);
		color: var(--hypnosis-badge-text);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
	}

	/* Session Form */
	.session-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		font-family: 'Inter', sans-serif;
	}

	.session-options {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	/* Option Groups */
	.option-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.option-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.option-group label {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'Inter', sans-serif;
	}

	.option-note {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-style: italic;
		font-weight: normal;
	}

	/* Cycle Selector */
	.cycle-selector {
		display: flex;
		align-items: center;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 8px;
		overflow: hidden;
	}

	.cycle-display {
		display: flex;
		align-items: center;
		padding: 0.5rem 0.75rem;
		min-width: 120px;
		justify-content: center;
		gap: 0.5rem;
	}

	.cycle-display i {
		font-size: 1rem;
		color: var(--text-primary);
	}

	.cycle-display span {
		font-size: 0.85rem;
		color: var(--text-primary);
		font-weight: 500;
		font-family: 'Inter', sans-serif;
	}

	.cycle-btn {
		background: rgba(var(--interactive-gradient-1), 0.1);
		border: none;
		color: var(--text-secondary);
		width: 30px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cycle-btn:hover:not(:disabled) {
		background: rgba(var(--interactive-gradient-1), 0.2);
		color: var(--text-primary);
	}

	.cycle-btn:active:not(:disabled) {
		background: rgba(var(--interactive-gradient-1), 0.3);
	}

	.cycle-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.eyes-group.disabled .cycle-selector {
		opacity: 0.7;
	}

	/* Duration Slider */
	.duration-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.duration-badge {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-primary);
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.15) 0%,
			rgba(var(--interactive-gradient-2), 0.2) 100%
		);
		padding: 0.3rem 0.6rem;
		border-radius: 6px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		font-family: 'Inter', sans-serif;
	}

	.slider-container {
		position: relative;
		padding: 0 5px;
		margin: 0.25rem 0;
		height: 30px;
	}

	.slider-track {
		position: absolute;
		top: 50%;
		left: 5px;
		right: 5px;
		height: 6px;
		background: rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 3px;
		transform: translateY(-50%);
		pointer-events: none;
	}

	.slider-progress {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: var(--slider-progress-bg);
		border-radius: 3px;
		pointer-events: none;
	}

	.slider-container input {
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

	.slider-container input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		background: var(--background-card);
		border: 2px solid rgba(var(--interactive-gradient-1), 0.6);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 6px var(--ui-shadow);
		transition: all 0.3s ease;
		position: relative;
		top: 0;
	}

	.slider-container input::-moz-range-thumb {
		width: 18px;
		height: 18px;
		background: var(--background-card);
		border: 2px solid rgba(var(--interactive-gradient-1), 0.6);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 6px var(--ui-shadow);
		transition: all 0.3s ease;
		position: relative;
		top: 0;
	}

	.slider-container input::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 3px 8px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.8);
	}

	.slider-container input::-moz-range-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 3px 8px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.8);
	}

	/* Compact Options (Posture & Eyes) */
	.compact-options {
		display: flex;
		gap: 0.5rem;
	}

	.compact-option {
		flex: 1;
		display: flex;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.compact-option:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 10px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
	}

	.compact-option.selected {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.15) 0%,
			rgba(var(--interactive-gradient-2), 0.2) 100%
		);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
	}

	.compact-option i {
		font-size: 1rem;
		color: var(--text-secondary);
		margin-right: 0.5rem;
		transition: all 0.3s ease;
	}

	.compact-option.selected i {
		color: var(--text-primary);
	}

	.compact-option span {
		font-size: 0.85rem;
		color: var(--text-secondary);
		transition: all 0.3s ease;
	}

	.compact-option.selected span {
		color: var(--text-primary);
		font-weight: 500;
	}

	.eyes-group.disabled {
		opacity: 0.7;
		pointer-events: none;
	}

	/* Playlist Selector */
	.playlist-selector {
		position: relative;
	}

	.playlist-selector select {
		width: 100%;
		padding: 0.75rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.9rem;
		appearance: none;
		cursor: pointer;
		transition: all 0.3s ease;
		padding-right: 2.5rem;
		font-family: 'Inter', sans-serif;
	}

	.select-icon {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-secondary);
		pointer-events: none;
		transition: all 0.3s ease;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 50%;
	}

	.playlist-selector select:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 10px var(--ui-shadowHover);
	}

	.playlist-selector select:focus {
		outline: none;
		border-color: rgba(var(--interactive-gradient-1), 0.4);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.2);
	}

	.playlist-selector select:focus + .select-icon {
		background: rgba(var(--interactive-gradient-1), 0.2);
		color: var(--text-primary);
	}

	/* Hypnosis Prompt */
	.prompt-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.prompt-input textarea {
		width: 100%;
		padding: 0.75rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-family: 'Inter', sans-serif;
		resize: vertical;
		min-height: 80px;
		transition: all 0.3s ease;
		box-sizing: border-box;
	}

	.prompt-input textarea:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 10px var(--ui-shadowHover);
	}

	.prompt-input textarea:focus {
		outline: none;
		border-color: rgba(var(--interactive-gradient-1), 0.4);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.2);
	}

	.prompt-info {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(var(--interactive-gradient-1), 0.05);
		border-radius: 6px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.prompt-info i {
		color: rgba(var(--interactive-gradient-1), 0.7);
		font-size: 0.9rem;
		margin-top: 0.1rem;
	}

	.prompt-info span {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.4;
		font-family: 'Inter', sans-serif;
	}

	/* Settings Info for Hypnosis */
	.settings-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border-radius: 6px;
	}

	.setting-item i {
		font-size: 0.9rem;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 50%;
		color: var(--text-primary);
	}

	.setting-item span {
		font-size: 0.85rem;
		color: var(--text-primary);
		font-family: 'Inter', sans-serif;
	}

	/* Generate Button */
	.generate-btn {
		width: 100%;
		padding: 0.9rem;
		margin-top: 0.5rem;
		font-size: 1rem;
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
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
		box-shadow: 0 6px 15px rgba(var(--interactive-gradient-1), 0.25);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
	}

	.generate-btn:not(:disabled):hover::after {
		left: 100%;
	}

	.generate-btn:not(:disabled):active {
		transform: translateY(-1px);
		box-shadow: 0 4px 10px rgba(var(--interactive-gradient-1), 0.15);
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
	.error-message {
		margin-top: 1rem;
		padding: 0.75rem;
		border-radius: 8px;
		background: var(--background-error);
		color: var(--text-error);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		border: 1px solid rgba(var(--ui-danger), 0.2);
		box-shadow: 0 4px 10px rgba(var(--ui-danger), 0.1);
		font-family: 'Inter', sans-serif;
	}

	.error-message i {
		font-size: 1rem;
	}

	.error-message p {
		margin: 0;
	}

	/* Responsive Styles */
	@media (max-width: 480px) {
		h1 {
			font-size: 1.75rem;
			margin-bottom: 1.25rem;
		}

		.session-card {
			padding: 1.25rem 1rem;
		}

		.session-type-selector {
			margin-bottom: 1rem;
		}

		.session-type-selector button {
			padding: 0.6rem 0.5rem;
		}

		.compact-options {
			flex-wrap: wrap;
		}

		.compact-option {
			min-width: 45%;
		}

		.generate-btn {
			padding: 0.75rem;
			font-size: 0.95rem;
		}
	}
</style>
