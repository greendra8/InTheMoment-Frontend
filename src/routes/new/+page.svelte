<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { subscribeMeditationStatus } from '$lib/api';
	import { onDestroy, onMount } from 'svelte';
	import { text, background, ui, icon } from '$lib/theme';
	import { meditationGeneration } from '$lib/stores/meditationGeneration';
	import { showError, showLoading, notifications, showSuccess } from '$lib/stores/notifications';
	import SessionDialog from '$lib/components/SessionDialog/SessionDialog.svelte';
	import { browser } from '$app/environment';
	import SessionTypeSelector from './components/SessionTypeSelector.svelte';
	import SessionForm from './components/SessionForm.svelte';

	// Cookie constants
	const PRE_SESSION_COOKIE_NAME = 'pre_session_data';
	const COOKIE_EXPIRY_HOURS = 2;

	// Function to set a cookie with expiration time
	function setCookie(name: string, value: string, hours: number = COOKIE_EXPIRY_HOURS) {
		if (!browser) return;

		const expires = new Date();
		expires.setTime(expires.getTime() + hours * 60 * 60 * 1000);
		document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
	}

	// Function to get a cookie value
	function getCookie(name: string): string | null {
		if (!browser) return null;

		const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
		if (match) return decodeURIComponent(match[2]);
		return null;
	}

	// Function to delete a cookie
	function deleteCookie(name: string) {
		if (!browser) return;

		document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
	}

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

	// Separate settings for meditation and hypnosis
	let meditationSettings = {
		posture: postureOptions[0].value,
		eyes: eyesOptions[1].value,
		duration: 15,
		playlist: data.selectedPlaylist ? data.selectedPlaylist.id : ''
	};

	let hypnosisSettings = {
		posture: 'lying',
		eyes: 'closed',
		duration: 15,
		prompt: ''
	};

	// Active settings based on session type
	$: selectedPosture =
		sessionType === 'meditation' ? meditationSettings.posture : hypnosisSettings.posture;
	$: selectedEyes = sessionType === 'meditation' ? meditationSettings.eyes : hypnosisSettings.eyes;
	$: duration =
		sessionType === 'meditation' ? meditationSettings.duration : hypnosisSettings.duration;
	$: selectedPlaylist = meditationSettings.playlist;
	$: hypnosisPrompt = hypnosisSettings.prompt;

	// Update the appropriate settings object when values change
	$: if (sessionType === 'meditation') {
		meditationSettings.posture = selectedPosture;
		meditationSettings.eyes = selectedEyes;
		meditationSettings.duration = duration;
		meditationSettings.playlist = selectedPlaylist;
	} else {
		hypnosisSettings.duration = duration;
		hypnosisSettings.prompt = hypnosisPrompt;
	}

	// Common options
	let formResult: CustomActionData | null = null;
	let formElement: HTMLFormElement;

	// Default values for reset functionality
	const defaultValues = {
		sessionType: 'meditation' as 'meditation' | 'hypnosis',
		meditation: {
			playlist: data.selectedPlaylist ? data.selectedPlaylist.id : '',
			posture: postureOptions[0].value,
			eyes: eyesOptions[1].value,
			duration: 15
		},
		hypnosis: {
			posture: 'lying',
			eyes: 'closed',
			duration: 15,
			prompt: ''
		}
	};

	// Function to reset form to default values
	function resetForm() {
		// Store the current session type to maintain the same tab
		const currentSessionType = sessionType;

		// Reset both meditation and hypnosis settings
		meditationSettings = { ...defaultValues.meditation };
		hypnosisSettings = { ...defaultValues.hypnosis };

		// Keep the user in the same tab they were in
		sessionType = currentSessionType;

		// Reset autoConfig to null to clear any pre-session dialog settings
		autoConfig = null;

		// Delete the pre-session cookie when resetting
		deleteCookie(PRE_SESSION_COOKIE_NAME);
	}

	// Handle walking posture (eyes must be open)
	$: isWalking = selectedPosture === postureOptions[2].value;
	$: {
		if (isWalking && sessionType === 'meditation') {
			meditationSettings.eyes = eyesOptions[0].value; // Set to "Open" when walking
			selectedEyes = meditationSettings.eyes;
		}
	}

	// Add new state for pre-session check-in
	let showPreSession = true;
	let autoConfig: {
		length: number;
		posture: string;
		eyes: string;
		conversation: Array<{ role: string; content: string }>;
		sessionType?: 'meditation' | 'hypnosis';
		hypnosisPrompt?: string;
	} | null = null;

	// Determine if this is the user's first session
	$: isFirstSession = data.meditations && data.meditations.length === 0;

	// Use server-provided hasPreviousCheckIn if available, otherwise check client-side
	$: hasPreviousCheckIn =
		data.hasPreviousCheckIn !== undefined
			? data.hasPreviousCheckIn
			: browser
				? !!getCookie(PRE_SESSION_COOKIE_NAME)
				: false;

	// Update showPreSession based on URL parameters or server data
	$: if (browser) {
		showPreSession = !$page.url.searchParams.has('configure') && !data.configureMode;
	} else {
		showPreSession = !data.configureMode;
	}

	// Helper function to safely parse cookie data
	function safelyParseCookieData(cookieData: string | null): any | null {
		if (!cookieData) return null;

		try {
			return JSON.parse(cookieData);
		} catch (e) {
			console.error('Error parsing cookie data:', e);
			deleteCookie(PRE_SESSION_COOKIE_NAME);
			return null;
		}
	}

	// Check URL parameters on mount to determine if we should show pre-session
	onMount(() => {
		if (browser) {
			// Listen for popstate events (browser back/forward buttons)
			window.addEventListener('popstate', handlePopState);

			// Try to load pre-session data from cookie or server data
			if (!showPreSession) {
				// First try to use server-provided data
				if (data.preSessionData) {
					autoConfig = data.preSessionData;
					applyAutoConfig();
				} else {
					// Fall back to client-side cookie
					const parsedData = safelyParseCookieData(getCookie(PRE_SESSION_COOKIE_NAME));
					if (parsedData) {
						autoConfig = parsedData;
						applyAutoConfig();
					}
				}
			}
		}

		return () => {
			if (browser) {
				window.removeEventListener('popstate', handlePopState);
			}
		};
	});

	// Helper function to apply autoConfig settings to form fields
	function applyAutoConfig() {
		if (!autoConfig) return;

		if (autoConfig.sessionType) {
			sessionType = autoConfig.sessionType;
		}

		// Apply settings to the appropriate settings object based on session type
		if (sessionType === 'meditation') {
			meditationSettings.duration = autoConfig.length;
			meditationSettings.posture = autoConfig.posture;
			meditationSettings.eyes = autoConfig.eyes;
		} else {
			hypnosisSettings.duration = autoConfig.length;
			hypnosisSettings.posture = autoConfig.posture;
			hypnosisSettings.eyes = autoConfig.eyes;

			// Set hypnosis prompt if provided
			if (autoConfig.hypnosisPrompt) {
				hypnosisSettings.prompt = autoConfig.hypnosisPrompt;
			}
		}

		console.log('Applied auto-config to form fields:', autoConfig);
	}

	// Handle browser navigation events
	function handlePopState() {
		if (browser) {
			showPreSession = !$page.url.searchParams.has('configure');
		}
	}

	// Handle session type selection
	function handleSessionTypeChange(type: 'meditation' | 'hypnosis') {
		sessionType = type;
	}

	// Handle pre-session configuration
	function handlePreSessionConfig(
		event: CustomEvent<{
			length: number;
			posture: string;
			eyes: string;
			conversation: Array<{ role: string; content: string }>;
			sessionType?: 'meditation' | 'hypnosis';
			hypnosisPrompt?: string;
		}>
	) {
		autoConfig = event.detail;

		// Update URL to reflect the state change
		goto('?configure=true', { keepFocus: true, replaceState: false });

		// Update form values with AI recommendations
		if (autoConfig.sessionType) {
			sessionType = autoConfig.sessionType;
		}

		// Update the appropriate settings object based on session type
		if (sessionType === 'meditation') {
			meditationSettings.duration = autoConfig.length;
			meditationSettings.posture = autoConfig.posture;
			meditationSettings.eyes = autoConfig.eyes;
		} else {
			hypnosisSettings.duration = autoConfig.length;
			hypnosisSettings.posture = autoConfig.posture;
			hypnosisSettings.eyes = autoConfig.eyes;

			// Set hypnosis prompt if provided
			if (autoConfig.hypnosisPrompt) {
				hypnosisSettings.prompt = autoConfig.hypnosisPrompt;
			}
		}

		// Save the pre-session data to a cookie
		setCookie(PRE_SESSION_COOKIE_NAME, JSON.stringify(autoConfig));

		console.log('Pre-session check-in complete with config:', autoConfig);
	}

	// Handle skip pre-session
	function handlePreSessionSkip() {
		// Update URL to reflect the state change
		goto('?configure=true', { keepFocus: true, replaceState: false });

		// If there's previous check-in data in the cookie, load it now
		if (hasPreviousCheckIn) {
			const parsedData = safelyParseCookieData(getCookie(PRE_SESSION_COOKIE_NAME));
			if (parsedData) {
				autoConfig = parsedData;
				applyAutoConfig();
			}
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

	function getStatusMessage(status: string, generatingSessionType: string): string {
		switch (status) {
			case 'Queued':
			case '':
				return 'Your session is in the queue...';
			case 'Fetching':
				return 'Fetching session details...';
			case 'Scripting':
				return `Writing your ${generatingSessionType} script...`;
			case 'Reviewing':
				return `Reviewing your ${generatingSessionType} script...`;
			case 'Audio Generation':
				return `Recording your ${generatingSessionType}...`;
			case 'Processing':
				return `Processing your ${generatingSessionType}...`;
			case 'Uploading':
				return `Uploading your ${generatingSessionType}...`;
			case 'Saving':
				return `Saving your ${generatingSessionType}...`;
			case 'Completed':
				return `Your ${generatingSessionType} is ready!`;
			case 'Failed':
				return `${generatingSessionType} generation failed. Please try again.`;
			default:
				return 'Starting your generation...';
		}
	}

	function createParametersJSON() {
		const params: any = {
			posture: selectedPosture,
			eyes: selectedEyes
		};

		// Set prompt field for hypnosis
		if (sessionType === 'hypnosis' && hypnosisPrompt) {
			params.prompt = hypnosisPrompt.trim();
		} else {
			// Empty prompt for meditation
			params.prompt = '';
		}

		// Add playlist_id for meditation if selected
		if (sessionType === 'meditation' && selectedPlaylist) {
			params.playlist_id = selectedPlaylist;
		}

		// Add conversation from pre-session check-in as a string
		if (autoConfig && autoConfig.conversation && autoConfig.conversation.length > 0) {
			// Convert conversation array to a formatted string
			const conversationString = autoConfig.conversation
				.map((msg) => `${msg.role}: ${msg.content}`)
				.join('\n');
			params.conversation = conversationString;
		} else {
			params.conversation = '';
		}

		// If we have a hypnosis prompt from autoConfig and the current session type is hypnosis,
		// use that prompt instead of any existing one
		if (sessionType === 'hypnosis' && autoConfig && autoConfig.hypnosisPrompt) {
			params.prompt = autoConfig.hypnosisPrompt;
		}

		return params;
	}

	async function handleFormSubmit(event: Event) {
		console.log('Client: handleFormSubmit called');
		event.preventDefault();

		// Prevent multiple submissions
		if ($meditationGeneration.isGenerating) {
			return;
		}

		// Store the current session type for notifications
		const generatingSessionType = sessionType;

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

			if (!response.ok) {
				throw new Error(`Server returned ${response.status}: ${response.statusText}`);
			}

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
					// Store the session type in the meditation generation store
					meditationGeneration.startGeneration(meditationId, generatingSessionType);
					const loadingNotificationId = showLoading('Starting your session generation...', {
						dismissible: false
					});

					// Clear the pre-session cookie after successful generation
					deleteCookie(PRE_SESSION_COOKIE_NAME);

					// Subscribe to status updates
					const unsubscribe = subscribeMeditationStatus(meditationId, (status) => {
						meditationGeneration.updateStatus(status);

						// Update the loading notification with the current status
						if (status === 'Completed') {
							notifications.clear();
							showSuccess(`Your ${generatingSessionType} is ready!`, {
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
							showError(`${generatingSessionType} generation failed. Please try again.`);
							meditationGeneration.failGeneration();
							if (unsubscribe) unsubscribe();
						} else {
							// Update the existing notification
							notifications.update(loadingNotificationId, {
								message: getStatusMessage(status, generatingSessionType)
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

	// Get the initialQuestion from the server data
	$: initialQuestion = $page.data.initialQuestion || '';

	onDestroy(() => {
		// No need to unsubscribe as the global state handles the subscription
	});
</script>

<svelte:head>
	<title>New Session | InTheMoment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="session-container">
	{#if showPreSession}
		<h1>Session Check-in</h1>
		<SessionDialog
			mode="pre"
			{initialQuestion}
			{isFirstSession}
			{hasPreviousCheckIn}
			on:config={handlePreSessionConfig}
			on:skip={handlePreSessionSkip}
		/>
	{:else}
		<h1>New Session</h1>
		<div class="session-card">
			<!-- Session Type Selection -->
			<SessionTypeSelector {sessionType} onSelect={handleSessionTypeChange} />

			<!-- Session Form -->
			<SessionForm
				{sessionType}
				bind:formElement
				{handleFormSubmit}
				{resetForm}
				{data}
				{autoConfig}
				{createParametersJSON}
				{getUserLocalTime}
				{formResult}
				bind:meditationSettings
				bind:hypnosisSettings
				bind:selectedPosture
				bind:selectedEyes
				bind:duration
				bind:selectedPlaylist
				bind:hypnosisPrompt
				{isWalking}
				{postureOptions}
				{eyesOptions}
			/>
		</div>
	{/if}
</div>

<style>
	/* Main container */
	.session-container {
		width: 100%;
		max-width: 800px;
		padding-top: 1.5rem;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		position: relative;
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
	}
</style>
