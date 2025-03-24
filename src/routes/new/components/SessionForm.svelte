<script lang="ts">
	import { meditationGeneration } from '$lib/stores/meditationGeneration';
	import PlaylistSelector from './PlaylistSelector.svelte';
	import DurationSlider from './DurationSlider.svelte';
	import PostureSelector from './PostureSelector.svelte';
	import EyesSelector from './EyesSelector.svelte';
	import HypnosisPrompt from './HypnosisPrompt.svelte';
	import HypnosisSettings from './HypnosisSettings.svelte';
	import PreSessionIndicator from './PreSessionIndicator.svelte';
	import ActionButtons from './ActionButtons.svelte';
	import { getPlaylistConstraints } from '$lib/api';
	import { onMount } from 'svelte';

	// Props
	export let sessionType: 'meditation' | 'hypnosis';
	export let formElement: HTMLFormElement;
	export let handleFormSubmit: (event: Event) => Promise<void>;
	export let resetForm: () => void;
	export let data: any;
	export let autoConfig: any | null;
	export let createParametersJSON: () => any;
	export let getUserLocalTime: () => string;
	export let formResult: any | null;

	// Meditation settings
	export let meditationSettings: {
		posture: string;
		eyes: string;
		duration: number;
		playlist: string;
	};

	// Hypnosis settings
	export let hypnosisSettings: {
		posture: string;
		eyes: string;
		duration: number;
		prompt: string;
	};

	// Computed props
	export let selectedPosture: string;
	export let selectedEyes: string;
	export let duration: number;
	export let selectedPlaylist: string;
	export let hypnosisPrompt: string;
	export let isWalking: boolean;

	// Posture and eyes options
	export let postureOptions: { value: string; display: string; icon: string }[];
	export let eyesOptions: { value: string; display: string; icon: string }[];

	// Check for playlist constraints
	$: hasPostureConstraint = false;
	$: hasEyesConstraint = false;
	$: postureConstraint = null;
	$: eyesConstraint = null;

	// Loading state for constraints
	let loadingConstraints = false;

	// Fetch constraints when playlist selection changes
	async function fetchPlaylistConstraints(playlistId: string) {
		if (!playlistId) {
			// Reset constraints if no playlist is selected
			hasPostureConstraint = false;
			hasEyesConstraint = false;
			postureConstraint = null;
			eyesConstraint = null;
			return;
		}

		try {
			loadingConstraints = true;
			const constraints = await getPlaylistConstraints(playlistId);

			// Update constraint values
			hasPostureConstraint = !!constraints.postureConstraint;
			hasEyesConstraint = !!constraints.eyesConstraint;
			postureConstraint = constraints.postureConstraint;
			eyesConstraint = constraints.eyesConstraint;
		} catch (error) {
			console.error('Error fetching playlist constraints:', error);
			// Reset constraints on error
			hasPostureConstraint = false;
			hasEyesConstraint = false;
			postureConstraint = null;
			eyesConstraint = null;
		} finally {
			loadingConstraints = false;
		}
	}

	// Determine if there are constraints from the selected playlist on initial load
	$: if (sessionType === 'meditation' && data.selectedPlaylist) {
		// Check if the selected playlist has constraint values from the server
		if (data.selectedPlaylist.postureConstraint) {
			hasPostureConstraint = true;
			postureConstraint = data.selectedPlaylist.postureConstraint;
		}

		if (data.selectedPlaylist.eyesConstraint) {
			hasEyesConstraint = true;
			eyesConstraint = data.selectedPlaylist.eyesConstraint;
		}
	}

	// Update handlers
	function handleDurationChange(newDuration: number) {
		if (sessionType === 'meditation') {
			meditationSettings.duration = newDuration;
		} else {
			hypnosisSettings.duration = newDuration;
		}
	}

	function handlePostureChange(newPosture: string) {
		if (sessionType === 'meditation') {
			meditationSettings.posture = newPosture;

			// If switching to walking, force eyes open
			if (newPosture === 'walking') {
				meditationSettings.eyes = eyesOptions[0].value; // "Open"
			}
		}
	}

	function handleEyesChange(newEyes: string) {
		if (sessionType === 'meditation') {
			meditationSettings.eyes = newEyes;
		}
	}

	async function handlePlaylistChange(newPlaylist: string) {
		meditationSettings.playlist = newPlaylist;

		// Fetch constraints for the newly selected playlist
		if (newPlaylist) {
			await fetchPlaylistConstraints(newPlaylist);
		} else {
			// Reset constraints if no playlist is selected
			hasPostureConstraint = false;
			hasEyesConstraint = false;
			postureConstraint = null;
			eyesConstraint = null;
		}
	}

	function handlePromptChange(newPrompt: string) {
		hypnosisSettings.prompt = newPrompt;
	}

	// Button state
	$: buttonDisabled =
		$meditationGeneration.isGenerating ||
		loadingConstraints ||
		(sessionType === 'hypnosis' && !hypnosisPrompt.trim());
</script>

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
			<PlaylistSelector
				{selectedPlaylist}
				playlists={data.playlists}
				onChange={handlePlaylistChange}
				loading={loadingConstraints}
			/>
		{:else}
			<!-- Hypnosis prompt -->
			<HypnosisPrompt prompt={hypnosisPrompt} onChange={handlePromptChange} />
		{/if}

		<!-- Pre-session data indicator -->
		{#if autoConfig && autoConfig.conversation && autoConfig.conversation.length > 0}
			<PreSessionIndicator conversationCount={autoConfig.conversation.length} />
		{/if}

		<!-- Common option: Duration -->
		<DurationSlider {duration} onChange={handleDurationChange} />

		{#if sessionType === 'meditation'}
			<!-- Meditation-specific options -->
			<PostureSelector
				{selectedPosture}
				{postureOptions}
				onChange={handlePostureChange}
				constrained={hasPostureConstraint}
				constraintValue={postureConstraint}
			/>

			<EyesSelector
				{selectedEyes}
				{eyesOptions}
				onChange={handleEyesChange}
				disabled={isWalking}
				constrained={hasEyesConstraint}
				constraintValue={eyesConstraint}
			/>
		{:else}
			<!-- Hypnosis settings info -->
			<HypnosisSettings />
		{/if}
	</div>

	<!-- Action buttons -->
	<ActionButtons
		onReset={resetForm}
		{buttonDisabled}
		isGenerating={$meditationGeneration.isGenerating}
		{sessionType}
		isLoading={loadingConstraints}
	/>

	<!-- Error message display -->
	{#if formResult && typeof formResult === 'object' && 'type' in formResult && formResult.type === 'error'}
		<div class="error-message">
			<i class="fas fa-exclamation-circle"></i>
			<p>{formResult.message || 'An error occurred'}</p>
		</div>
	{/if}
</form>

<style>
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
</style>
