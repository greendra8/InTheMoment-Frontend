<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { completeMeditation, submitFeedback } from '$lib/api';
	import type { PageData } from './$types';
	import { browser } from '$app/environment';
	import FeedbackForm from '$lib/components/FeedbackForm.svelte';
	import { writable } from 'svelte/store';
	import { fly, slide, fade } from 'svelte/transition';
	import AudioPlayer from './AudioPlayer.svelte';
	import { theme as themeStore } from '$lib/stores/theme';

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
		} catch (error) {
			console.error('Error submitting feedback:', error);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (isFeedbackFocused) return; // Exit early if the feedback form is focused

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

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			toggleFeedbackVisibility();
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

		document.addEventListener('click', handleOutsideClick);

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

			document.removeEventListener('click', handleOutsideClick);
		};
	});

	$: showFeedbackForm = meditation.listened || !!feedback || isCompletedThisSession;
</script>

<svelte:head>
	<title>{meditation.title}</title>
	<style>
		body {
			overflow: hidden;
		}
	</style>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div
	class="meditation-page {currentTheme}-theme {isFullscreen ? 'fullscreen' : ''} {isFeedbackVisible
		? 'feedback-open'
		: ''} {isHypnosis ? 'hypnosis-session' : ''}"
	style="height: {realViewportHeight}px;"
>
	{#if browser}
		{#if currentTheme === 'gem'}
			<div class="bg-gem-clouds {isHypnosis ? 'hypnosis-bg' : ''}"></div>
		{:else}
			<div class="bg-galaxy {isHypnosis ? 'hypnosis-bg' : ''}"></div>
		{/if}
	{/if}
	<div class="navigation-controls {isFeedbackVisible ? 'blurred' : ''}">
		<div class="back-icon" on:click={() => !isFeedbackVisible && window.history.back()}>
			<i class="fas fa-arrow-left"></i> <span class="back-text">Back</span>
		</div>
		<div class="fullscreen-icon" on:click={() => !isFeedbackVisible && toggleFullscreen()}>
			<i class="fas {isFullscreen ? 'fa-compress' : 'fa-expand'}"></i>
		</div>
		<div class="menu-icon" on:click|stopPropagation={() => !isFeedbackVisible && toggleMenu()}>
			<i class="fas fa-ellipsis-h"></i>
		</div>
	</div>

	{#if isMenuOpen}
		<div class="menu" transition:slide={{ duration: 300 }}>
			<ul>
				<li
					on:click|stopPropagation={isDownloaded ? null : triggerDownload}
					aria-label={isDownloaded ? 'Meditation downloaded' : 'Download meditation'}
				>
					<i class="fas {isDownloaded ? 'fa-check-circle' : 'fa-download'}"></i>
					{isDownloaded ? 'Already downloaded' : 'Download'}
				</li>
				<li
					on:click|stopPropagation={() => {
						if (!meditation.listened && !isCompletedThisSession) {
							completeMeditation(meditation.id, userId, meditation.length);
							isCompletedThisSession = true;
						}
					}}
				>
					<i
						class="fas {meditation.listened || isCompletedThisSession
							? 'fa-check-circle'
							: 'fa-check'}"
					></i>
					{meditation.listened || isCompletedThisSession ? 'Already completed' : 'Mark as complete'}
				</li>
			</ul>
		</div>
	{/if}

	<div class="meditation-content">
		<header>
			<div class="header-content">
				<h2>
					<span class="title-wrapper">
						{#if meditation.listened || isCompletedThisSession}
							<span class="listened-icon" title="You've listened to this session before">
								<i class="fas fa-check-circle"></i>
							</span>
						{/if}
						{meditation.title}
					</span>
				</h2>
				<div class="session-type-indicator">
					<span class="session-type-badge" class:hypnosis={meditation.content_type === 'hypnosis'}>
						{meditation.content_type === 'hypnosis' ? 'Hypnosis' : 'Meditation'}
					</span>
				</div>
				<div class="meditation-info">
					<span class="info-item">
						<i class="fas fa-layer-group"></i>
						{#if meditation.lesson_playlists}
							<a href="/playlists/{meditation.playlist_id}"
								>{meditation.lesson_playlists.playlist_name}</a
							>
						{:else}
							{meditation.theme}
						{/if}
					</span>
					<span class="info-item">
						<i class="fas fa-signal"></i>{' '}
						{meditation.difficulty.charAt(0).toUpperCase() + meditation.difficulty.slice(1)}
					</span>
				</div>
			</div>
		</header>

		<AudioPlayer
			bind:this={audioPlayerComponent}
			{audioUrl}
			meditationId={meditation.id}
			duration={meditation.length_ms / 1000}
			{userId}
			{isFeedbackVisible}
			{sendCompletionRequest}
		/>

		{#if showFeedbackForm && isFeedbackVisible}
			<div
				class="blurred-overlay"
				transition:fade={{ duration: 300 }}
				on:click={handleOverlayClick}
			>
				<div class="feedback-container" on:click|stopPropagation>
					<div class="feedback-section" transition:fly={{ y: 300, duration: 400 }}>
						<FeedbackForm
							sessionId={meditation.id}
							profileId={userId}
							existingFeedback={$localFeedback || feedback?.text}
							on:submit={handleFeedbackSubmit}
							on:focus={handleFeedbackFocus}
							on:blur={handleFeedbackBlur}
							on:close={toggleFeedbackVisibility}
						/>
					</div>
				</div>
			</div>
		{/if}

		<div class="feedback-controls-wrapper">
			{#if showFeedbackForm}
				<button class="show-feedback-button" on:click={toggleFeedbackVisibility}>
					<i class="fas fa-comment-alt"></i>&nbsp;
					{feedback || $localFeedback ? 'Edit Feedback' : 'Add Feedback'}
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	/* =======================
   Layout and Structure
   ======================= */
	.meditation-page {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		overflow: hidden;
		position: relative;
		height: var(--real-viewport-height, 100vh);
	}

	.meditation-page.fullscreen {
		position: static;
	}

	/* Shared background for all themes */
	.bg-gem-clouds,
	.bg-galaxy {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 0;
		overflow: hidden;
	}

	/* Base background gradient for each theme */
	.bg-gem-clouds {
		background: linear-gradient(to bottom, var(--background-main), rgba(20, 20, 40, 1));
	}

	.bg-galaxy {
		background: linear-gradient(to bottom, var(--background-main), rgba(10, 10, 32, 1));
	}

	/* First cloud layer */
	.bg-light-clouds::before,
	.bg-gem-clouds::before,
	.bg-galaxy::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 0.8;
		filter: blur(60px);
	}

	/* Theme-specific colors for first layer */
	.bg-light-clouds::before {
		background:
			radial-gradient(circle at 20% 30%, rgba(79, 172, 254, 0.12) 0%, transparent 60%),
			radial-gradient(circle at 80% 70%, rgba(0, 242, 254, 0.12) 0%, transparent 60%);
	}

	.bg-gem-clouds::before {
		background:
			radial-gradient(circle at 20% 30%, rgba(79, 172, 254, 0.12) 0%, transparent 60%),
			radial-gradient(circle at 80% 70%, rgba(0, 242, 254, 0.12) 0%, transparent 60%);
	}

	.bg-galaxy::before {
		background:
			radial-gradient(circle at 20% 30%, rgba(106, 90, 205, 0.15) 0%, transparent 60%),
			radial-gradient(circle at 80% 70%, rgba(132, 112, 255, 0.15) 0%, transparent 60%);
	}

	/* Second cloud layer */
	.bg-light-clouds::after,
	.bg-gem-clouds::after,
	.bg-galaxy::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 0.7;
		filter: blur(80px);
	}

	/* Theme-specific colors for second layer */
	.bg-light-clouds::after {
		background:
			radial-gradient(circle at 70% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 60%),
			radial-gradient(circle at 30% 80%, rgba(118, 75, 162, 0.15) 0%, transparent 60%);
	}

	.bg-gem-clouds::after {
		background:
			radial-gradient(circle at 70% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 60%),
			radial-gradient(circle at 30% 80%, rgba(118, 75, 162, 0.15) 0%, transparent 60%);
	}

	.bg-galaxy::after {
		background:
			radial-gradient(circle at 70% 20%, rgba(123, 104, 238, 0.18) 0%, transparent 60%),
			radial-gradient(circle at 30% 80%, rgba(147, 112, 219, 0.18) 0%, transparent 60%);
	}

	/* Additional swirling layer shared between themes */
	.swirl-layer {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		filter: blur(50px);
	}

	/* Show the image when loaded */
	.bg-image.loaded {
		opacity: 1;
	}

	/* Hypnosis-specific background styles */
	.hypnosis-session .bg-gem-clouds,
	.hypnosis-session .bg-galaxy {
		transition: background 1s ease;
	}

	.hypnosis-session .bg-gem-clouds {
		background: linear-gradient(to bottom, var(--background-main), rgba(40, 10, 60, 1));
	}

	.hypnosis-session .bg-galaxy {
		background: linear-gradient(to bottom, var(--background-main), rgba(30, 5, 50, 1));
	}

	/* Hypnosis-specific first cloud layer */
	.hypnosis-bg::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 0.7;
		filter: blur(70px);
	}

	.gem-theme .hypnosis-bg::before {
		background:
			radial-gradient(circle at 20% 30%, rgba(138, 43, 226, 0.15) 0%, transparent 70%),
			radial-gradient(circle at 80% 70%, rgba(147, 112, 219, 0.15) 0%, transparent 70%);
	}

	.hypnosis-bg::before {
		background:
			radial-gradient(circle at 20% 30%, rgba(138, 43, 226, 0.15) 0%, transparent 70%),
			radial-gradient(circle at 80% 70%, rgba(147, 112, 219, 0.15) 0%, transparent 70%);
	}

	/* Hypnosis-specific second cloud layer */
	.hypnosis-bg::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		opacity: 0.6;
		filter: blur(90px);
	}

	.gem-theme .hypnosis-bg::after {
		background:
			radial-gradient(circle at 70% 20%, rgba(186, 85, 211, 0.15) 0%, transparent 70%),
			radial-gradient(circle at 30% 80%, rgba(153, 50, 204, 0.15) 0%, transparent 70%);
	}

	.hypnosis-bg::after {
		background:
			radial-gradient(circle at 70% 20%, rgba(186, 85, 211, 0.15) 0%, transparent 70%),
			radial-gradient(circle at 30% 80%, rgba(153, 50, 204, 0.15) 0%, transparent 70%);
	}

	/* Hypnosis spiral animation */
	/* .hypnosis-session::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 100%;
		height: 100%;
		transform: translate(-50%, -50%);
		background: radial-gradient(circle at center, transparent 30%, rgba(138, 43, 226, 0.03) 70%);
		opacity: 0;
		z-index: 0;
		animation: hypnosisSpiral 15s infinite alternate ease-in-out;
		pointer-events: none;
	} */

	/* Hypnosis animations */
	/* @keyframes hypnosisCloudMove {
		0% {
			transform: translateX(-5%) translateY(-5%) scale(1.05);
		}
		50% {
			transform: translateX(2%) translateY(2%) scale(1);
		}
		100% {
			transform: translateX(5%) translateY(5%) scale(1.05);
		}
	}

	@keyframes hypnosisSpiral {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.9) rotate(0deg);
		}
		50% {
			opacity: 0.5;
			transform: translate(-50%, -50%) scale(1) rotate(180deg);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.9) rotate(360deg);
		}
	}

	@keyframes cloudMove {
		0% {
			transform: translateX(-3%) translateY(-3%);
		}
		100% {
			transform: translateX(3%) translateY(3%);
		}
	} */

	.meditation-content {
		display: flex;
		flex-direction: column;
		height: var(--real-viewport-height, 100vh);
		box-sizing: border-box;
		position: relative;
		z-index: 1;
	}

	/* Hypnosis-specific text styling */
	.hypnosis-session h2 {
		text-shadow: 0 0 10px rgba(138, 43, 226, 0.3);
		transition: text-shadow 1s ease;
	}

	.hypnosis-session .info-item {
		color: var(--text-secondary);
		transition: color 1s ease;
	}

	.hypnosis-session .info-item i {
		color: rgba(186, 85, 211, 0.8);
	}

	/* =======================
   Header and Meditation Info
   ======================= */
	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		padding: 1rem;
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		text-align: center;
		z-index: 2;
		padding-top: clamp(3rem, 10vh, 4rem);
	}

	.header-content {
		max-width: 500px;
	}

	h2 {
		font-family: 'Space Grotesk', sans-serif;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: clamp(0.3rem, 2vw, 0.5rem);
	}

	.title-wrapper {
		font-family: 'Space Grotesk', sans-serif;
		position: relative;
		display: inline-block;
		padding-top: clamp(1.5rem, 4vw, 2rem);
	}

	.listened-icon {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		font-size: clamp(0.8rem, 2.5vw, 0.9rem);
		color: #4caf50;
	}

	.listened-icon i {
		border-radius: 50%;
	}

	.meditation-info {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: clamp(0.5rem, 2vw, 1rem);
		font-size: clamp(0.875rem, 2.5vw, 1rem);
		color: var(--text-secondary);
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.info-item a {
		text-decoration: none;
		background: var(--text-secondary);
		border-radius: 1rem;
		padding: 0 8px;
		color: var(--background-card);
	}

	/* =======================
   Navigation Controls
   ======================= */
	.navigation-controls {
		position: absolute;
		top: clamp(1rem, 3vw, 1.3rem);
		left: clamp(1rem, 3vw, 1.5rem);
		right: clamp(1rem, 3vw, 1.5rem);
		display: flex;
		justify-content: space-between;
		align-items: center;
		z-index: 10;
		padding: 0 0.5rem;
		transition:
			filter 0.3s ease,
			opacity 0.3s ease;
	}

	.navigation-controls.blurred {
		filter: blur(3px);
		opacity: 0.5;
		pointer-events: none;
	}

	/* Back Icon - Hidden by Default */
	.back-icon {
		display: none; /* Hidden by default, shown only on mobile */
		justify-content: center;
		align-items: center;
		cursor: pointer;
		transition: all 0.3s ease;
		padding: 0.5rem;
		color: var(--text-primary);
	}

	.back-icon:hover {
		transform: translateX(-2px);
	}

	.back-icon i {
		font-size: clamp(1.3rem, 3.5vw, 1.5rem);
		margin-right: 0.3rem;
	}

	.back-text {
		font-size: clamp(0.9rem, 2.5vw, 1rem);
		font-weight: 500;
	}

	/* Fullscreen Icon - Shown only on Desktop */
	.fullscreen-icon {
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		transition: all 0.3s ease;
		padding: 0.5rem;
		color: var(--text-primary);
		margin-left: auto; /* Push to right */
		margin-right: 0.5rem; /* Add space between fullscreen and menu icons */
	}

	.fullscreen-icon:hover {
		transform: scale(1.1);
	}

	.fullscreen-icon i {
		font-size: clamp(1.3rem, 3.5vw, 1.5rem);
	}

	/* Menu Icon */
	.menu-icon {
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		transition: all 0.3s ease;
		padding: 0.5rem;
		/* Remove margin-left: auto; as it's now on the fullscreen icon */
	}

	.menu-icon:hover {
		transform: translateY(-2px);
	}

	.menu-icon i {
		font-size: clamp(1.5rem, 4vw, 1.8rem);
		color: var(--text-primary);
	}

	/* Dropdown Menu */
	.menu {
		position: absolute;
		top: clamp(4rem, 9vw, 4.5rem);
		right: clamp(1rem, 3vw, 1.5rem);
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border-radius: 16px;
		box-shadow: 0 4px 20px var(--ui-shadow);
		z-index: 10;
		overflow: hidden;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.menu ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.menu li {
		padding: clamp(0.8rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem);
		font-size: clamp(0.875rem, 2.5vw, 1rem);
		cursor: pointer;
		transition: all 0.3s ease;
		position: relative;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.menu li:not(:last-child)::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 10%;
		width: 80%;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(var(--interactive-gradient-1), 0.3),
			transparent
		);
	}

	.menu li:hover {
		background-color: var(--background-cardHover);
	}

	/* =======================
   Feedback Form
   ======================= */
	.blurred-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: flex-end;
		z-index: 800;
	}

	.feedback-container {
		width: 100%;
		padding: 0;
		box-sizing: border-box;
		position: relative;
		max-height: 80vh;
		display: flex;
		justify-content: center;
	}

	.feedback-section {
		position: relative;
		width: 100%;
		max-width: 40rem;
		box-sizing: border-box;
		margin-top: 0;
	}

	/* Apply blur to main content when feedback is open */
	.meditation-page.feedback-open .meditation-content > *:not(.blurred-overlay) {
		filter: blur(3px);
		transition: filter 0.3s ease;
	}

	.show-feedback-button,
	.hide-feedback-button {
		padding: clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.8rem, 2.5vw, 1rem);
		font-size: clamp(0.875rem, 2.5vw, 1rem);
		font-family: 'Space Grotesk', sans-serif;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), var(--interactive-opacity-1)) 0%,
			rgba(var(--interactive-gradient-2), var(--interactive-opacity-2)) 100%
		);
		color: var(--text-primary);
		border: 2px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: clamp(0.4rem, 1.5vw, 0.5rem);
		cursor: pointer;
		transition: all 0.3s ease;
		opacity: 0.9;
	}

	.show-feedback-button:hover,
	.hide-feedback-button:hover {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), var(--interactive-hover-opacity-1)) 0%,
			rgba(var(--interactive-gradient-2), var(--interactive-hover-opacity-2)) 100%
		);
	}

	.feedback-controls-wrapper {
		position: fixed;
		bottom: 7rem;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		z-index: 2;
	}
	/* Native app specific positioning */
	:global(.native-app) :global(.controls-wrapper) {
		bottom: 6rem; /* More space at bottom for native app navigation */
	}

	:global(.native-app) .feedback-controls-wrapper {
		bottom: 8.5rem; /* More space at bottom for native app navigation */
	}
	/* =======================
   Utility Classes
   ======================= */
	.no-audio {
		text-align: center;
		color: var(--text-secondary);
		font-style: italic;
	}

	/* =======================
   Responsive Design
   ======================= */
	@media (max-width: 1024px) {
		.meditation-page {
			margin: 0 -1rem;
			position: static;
		}

		.meditation-content {
			padding: clamp(0.5rem, 2vw, 0.625rem);
		}

		.navigation-controls {
			left: clamp(0.75rem, 2vw, 1rem);
			right: clamp(0.75rem, 2vw, 1rem);
		}

		/* Show Back Icon on Mobile */
		.back-icon {
			display: flex;
		}

		/* Hide Fullscreen Icon on Mobile */
		.fullscreen-icon {
			display: none;
		}

		.feedback-container {
			padding: 0;
			max-height: 70vh;
		}
	}

	@media (max-width: 600px) {
		.feedback-controls-wrapper {
			max-width: 85%;
		}
	}

	/* Adjust for smaller screens */
	@media (max-height: 700px) {
		header {
			padding-top: 2rem;
		}

		h2 {
			font-size: 1.5rem;
		}

		.title-wrapper {
			padding-top: 1rem;
		}

		.listened-icon {
			top: -0.5rem;
		}

		.feedback-controls-wrapper {
			bottom: 3.5rem;
		}
	}

	/* Adjust for very small screens */
	/* @media (max-height: 600px) {
		header {
			padding-top: 1.5rem;
		}

		h2 {
			font-size: 1.25rem;
		}

		.meditation-info {
			font-size: 0.75rem;
		}
	} */

	/* Session Type Badge */
	.session-type-indicator {
		display: flex;
		justify-content: center;
		margin-top: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.session-type-badge {
		font-size: 0.8rem;
		padding: 0.3rem 0.8rem;
		border-radius: 12px;
		background: var(--meditation-badge-bg);
		color: var(--meditation-badge-text);
		font-weight: 500;
		text-transform: capitalize;
		letter-spacing: 0.5px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.session-type-badge.hypnosis {
		background: var(--hypnosis-badge-bg);
		color: var(--hypnosis-badge-text);
		border: 1px solid rgba(186, 85, 211, 0.2);
		box-shadow: 0 0 10px rgba(138, 43, 226, 0.2);
	}
</style>
