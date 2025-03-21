<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { completeMeditation, submitFeedback, toggleMeditationCompletion } from '$lib/api';
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import { writable } from 'svelte/store';
	import AudioPlayer from './AudioPlayer.svelte';
	import { theme as themeStore } from '$lib/stores/theme';

	// Import new components
	import MainLayout from './MainLayout.svelte';
	import BackgroundEffect from './BackgroundEffect.svelte';
	import Header from './Header.svelte';
	import NavigationControls from './NavigationControls.svelte';
	import Menu from './Menu.svelte';
	import FeedbackDialog from './FeedbackDialog.svelte';
	import SessionControls from './SessionControls.svelte';

	export let data: PageData;
	const { meditation, userId, feedback, fullscreenPreference } = data;

	const audioUrl = meditation.signedAudioUrl;
	const isHypnosis = meditation.content_type === 'hypnosis';

	let isCompletedThisSession = false;
	let showFeedbackForm = meditation.listened || !!feedback || isCompletedThisSession;
	let isFeedbackVisible = false;

	let isFeedbackFocused = false;

	let localFeedback = writable(feedback?.text || '');

	// Store the real viewport height, accounting for mobile browser UI
	let realViewportHeight: number;

	let audioPlayerComponent: AudioPlayer;

	let isMenuOpen = false;

	// Current theme
	let currentTheme: string;
	themeStore.subscribe((value) => {
		currentTheme = value;
	});

	// Fullscreen mode state - initialize from server data to prevent FOUC
	let isFullscreen = fullscreenPreference;

	// Cookie name for fullscreen preference
	const FULLSCREEN_COOKIE_NAME = 'meditation_fullscreen_preference';

	function setRealViewportHeight() {
		realViewportHeight = window.innerHeight;
		document.documentElement.style.setProperty('--real-viewport-height', `${realViewportHeight}px`);
	}

	function handleResize() {
		setRealViewportHeight();
	}

	async function handleFeedbackSubmit(event: CustomEvent) {
		const { sessionId, profileId, feedback } = event.detail;
		console.log('Handling feedback submission:', { sessionId, profileId, feedback });
		try {
			const result = await submitFeedback(sessionId, profileId, feedback);
			console.log('Feedback submitted successfully:', result);
			localFeedback.set(feedback);
			// Signal the dialog that submission is complete
			window.dispatchEvent(
				new CustomEvent('feedbackSubmissionComplete', {
					detail: { feedback }
				})
			);
		} catch (error) {
			console.error('Error submitting feedback:', error);
			// Signal submission error to the dialog
			window.dispatchEvent(
				new CustomEvent('feedbackSubmissionError', {
					detail: { error: error instanceof Error ? error.message : 'Failed to submit feedback' }
				})
			);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (isFeedbackVisible) return; // Exit early if the feedback form is focused

		if (event.key === 'ArrowLeft') {
			audioPlayerComponent.seekBackward(10);
		} else if (event.key === 'ArrowRight') {
			audioPlayerComponent.seekForward(10);
		} else if (event.key === ' ' || event.key.toLowerCase() === 'k') {
			event.preventDefault();
			audioPlayerComponent.togglePlayPause();
		} else if (event.key.toLowerCase() === 'm') {
			audioPlayerComponent.toggleMute();
		} else if (event.key === 'ArrowUp') {
			audioPlayerComponent.adjustVolume(0.1);
		} else if (event.key === 'ArrowDown') {
			audioPlayerComponent.adjustVolume(-0.1);
		}
	}

	function handleFeedbackFocus() {
		isFeedbackFocused = true;
	}

	function handleFeedbackBlur() {
		isFeedbackFocused = false;
	}

	function toggleFeedbackVisibility() {
		isFeedbackVisible = !isFeedbackVisible;
	}

	async function sendCompletionRequest() {
		if (isCompletedThisSession) return;

		const minutesAwarded = meditation.length;

		try {
			await completeMeditation(meditation.id, userId, minutesAwarded);
			console.log('Meditation completion request sent');
			isCompletedThisSession = true;
			showFeedbackForm = true;
			isFeedbackVisible = true;
		} catch (error) {
			console.error('Error recording meditation completion:', error);
		}
	}

	// Download handling code
	let isDownloaded = false;

	function updateDownloadUI(meditationId: string, downloadStatus: boolean) {
		if (meditationId === meditation.id) {
			isDownloaded = downloadStatus;
		}
	}

	function handleDownloadStatusUpdate(event: CustomEvent) {
		const { meditationId, isDownloaded: downloadStatus } = event.detail;
		updateDownloadUI(meditationId, downloadStatus);
	}

	function handleDownloadComplete(event: CustomEvent) {
		const { meditationId } = event.detail;
		updateDownloadUI(meditationId, true);
	}

	function checkDownloadStatus() {
		if (browser && (window as any).ReactNativeWebView) {
			(window as any).ReactNativeWebView.postMessage(
				JSON.stringify({
					type: 'checkDownloadStatus',
					payload: { meditationId: meditation.id }
				})
			);
		}
	}

	function triggerDownload() {
		if (browser && (window as any).ReactNativeWebView) {
			const message = {
				type: 'download',
				payload: {
					url: audioUrl,
					filename: `meditation_${meditation.id}.mp3`,
					metadata: {
						id: meditation.id,
						title: meditation.title,
						duration: meditation.length_ms / 1000,
						theme: meditation.theme,
						difficulty: meditation.difficulty,
						audio_data: meditation.audio_data,
						created_at: meditation.created_at
					}
				}
			};

			(window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
		} else {
			alert('Please install our app to get access to offline sessions');
			console.log('Download functionality is only available in the mobile app');
		}
	}

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	// Save fullscreen preference to cookie only
	function saveFullscreenPreference(value: boolean) {
		if (browser) {
			try {
				// Save to cookie with 1 year expiration
				document.cookie = `${FULLSCREEN_COOKIE_NAME}=${value}; path=/; max-age=31536000; SameSite=Lax`;
			} catch (error) {
				console.error('Error saving fullscreen preference:', error);
			}
		}
	}

	// Get fullscreen preference from cookie
	function getFullscreenPreferenceFromCookie(): boolean {
		if (browser) {
			try {
				const cookieValue = document.cookie
					.split('; ')
					.find((row) => row.startsWith(`${FULLSCREEN_COOKIE_NAME}=`))
					?.split('=')[1];

				return cookieValue === 'true';
			} catch (error) {
				console.error('Error reading fullscreen preference from cookie:', error);
				return false;
			}
		}
		return false;
	}

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
		saveFullscreenPreference(isFullscreen);

		// Force layout update
		setTimeout(() => {
			setRealViewportHeight();
		}, 50);
	}

	function handleOutsideClick(event: MouseEvent) {
		if (
			isMenuOpen &&
			!(event.target as Element).closest('.menu') &&
			!(event.target as Element).closest('.menu-icon')
		) {
			isMenuOpen = false;
		}
	}

	function handleToggleCompletion(event: CustomEvent) {
		const { meditationId, userId, length, currentStatus } = event.detail;
		toggleMeditationCompletion(meditationId, userId, length, currentStatus).then(() => {
			// Update the local state to reflect the change
			if (!currentStatus) {
				isCompletedThisSession = true;
			} else {
				isCompletedThisSession = false;
			}
		});
	}

	function handleMarkComplete(event: CustomEvent) {
		const { meditationId, userId, length } = event.detail;
		completeMeditation(meditationId, userId, length);
		isCompletedThisSession = true;
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);

		if (browser) {
			window.addEventListener('resize', handleResize);

			// Only check cookie if we didn't get the preference from SSR
			if (fullscreenPreference === undefined) {
				isFullscreen = getFullscreenPreferenceFromCookie();
			}
		}
		setRealViewportHeight();
		window.addEventListener('resize', setRealViewportHeight);
		window.addEventListener('orientationchange', setRealViewportHeight);

		// Download event listeners
		window.addEventListener('downloadStatusUpdate', handleDownloadStatusUpdate as EventListener);
		window.addEventListener('downloadComplete', handleDownloadComplete as EventListener);
		checkDownloadStatus();

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			if (browser) {
				window.removeEventListener('resize', handleResize);
			}
			window.removeEventListener('resize', setRealViewportHeight);
			window.removeEventListener('orientationchange', setRealViewportHeight);

			// Remove download event listeners
			window.removeEventListener(
				'downloadStatusUpdate',
				handleDownloadStatusUpdate as EventListener
			);
			window.removeEventListener('downloadComplete', handleDownloadComplete as EventListener);
		};
	});

	$: showFeedbackForm = meditation.listened || !!feedback || isCompletedThisSession;
	$: hasFeedback = !!feedback || !!$localFeedback;
</script>

<svelte:head>
	<title>{meditation.title}</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<style>
		body {
			overflow: hidden;
		}
	</style>
</svelte:head>

<MainLayout
	{currentTheme}
	{isFullscreen}
	{isFeedbackVisible}
	{isHypnosis}
	{realViewportHeight}
	{handleOutsideClick}
>
	<BackgroundEffect {currentTheme} {isHypnosis} {browser} />

	<NavigationControls
		{isFullscreen}
		{isFeedbackVisible}
		{isMenuOpen}
		on:toggleFullscreen={toggleFullscreen}
		on:toggleMenu={toggleMenu}
	/>

	<Menu
		isOpen={isMenuOpen}
		{isDownloaded}
		meditationId={meditation.id}
		{userId}
		listened={meditation.listened}
		meditationLength={meditation.length}
		{isCompletedThisSession}
		on:triggerDownload={triggerDownload}
		on:toggleCompletion={handleToggleCompletion}
	/>

	<Header
		title={meditation.title}
		theme={meditation.theme}
		difficulty={meditation.difficulty}
		contentType={meditation.content_type}
		playlistId={meditation.playlist_id}
		playlistName={meditation.lesson_playlists?.playlist_name}
		listened={meditation.listened}
		{isCompletedThisSession}
		{isHypnosis}
	/>

	<AudioPlayer
		bind:this={audioPlayerComponent}
		{audioUrl}
		meditationId={meditation.id}
		duration={meditation.length_ms / 1000}
		{userId}
		{isFeedbackVisible}
		{sendCompletionRequest}
	/>

	<FeedbackDialog
		isVisible={showFeedbackForm && isFeedbackVisible}
		sessionId={meditation.id}
		{userId}
		existingFeedback={$localFeedback || feedback?.text}
		on:submit={handleFeedbackSubmit}
		on:focus={handleFeedbackFocus}
		on:blur={handleFeedbackBlur}
		on:close={toggleFeedbackVisibility}
	/>

	<SessionControls {showFeedbackForm} {hasFeedback} on:toggleFeedback={toggleFeedbackVisibility} />
</MainLayout>
