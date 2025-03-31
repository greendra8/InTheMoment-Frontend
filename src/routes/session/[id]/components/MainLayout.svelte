<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let currentTheme: string;
	export let isFullscreen: boolean;
	export let isFeedbackVisible: boolean;
	export let isHypnosis: boolean;
	export let realViewportHeight: number;

	// Handle outside click for menu
	export let handleOutsideClick: (event: MouseEvent) => void;

	let isMobileWidth = false;
	const mobileBreakpoint = 1024;

	// Function to check width - only updates internal state
	function checkWidth() {
		if (browser) {
			isMobileWidth = window.innerWidth <= mobileBreakpoint;
			// Force Svelte to re-evaluate the reactive statement below
			// by reassigning the variable (even if value is the same)
			isMobileWidth = isMobileWidth;
		}
	}

	// Reactive statement: Re-runs whenever isFullscreen OR isMobileWidth changes
	$: if (browser) {
		const shouldApplyFullscreenClass = isFullscreen || isMobileWidth;
		// console.log(`Updating body class: isFullscreen=${isFullscreen}, isMobileWidth=${isMobileWidth}, ApplyClass=${shouldApplyFullscreenClass}`); // Debug log
		if (shouldApplyFullscreenClass) {
			document.body.classList.add('meditation-fullscreen');
		} else {
			document.body.classList.remove('meditation-fullscreen');
		}
	}

	onMount(() => {
		document.addEventListener('click', handleOutsideClick);
		window.addEventListener('resize', checkWidth);

		// Initial check for width
		checkWidth(); // Set initial isMobileWidth

		// Initial class application will be handled by the reactive statement `$: ...`
		// which runs automatically after onMount completes and state is set.

		return () => {
			document.removeEventListener('click', handleOutsideClick);
			window.removeEventListener('resize', checkWidth);
			if (browser) {
				// Always clean up on unmount
				document.body.classList.remove('meditation-fullscreen');
			}
		};
	});
</script>

<div
	class="meditation-page {currentTheme}-theme {isFullscreen || isMobileWidth
		? 'fullscreen'
		: ''} {isFeedbackVisible ? 'feedback-open' : ''} {isHypnosis ? 'hypnosis-session' : ''}"
	style="--local-real-viewport-height: {realViewportHeight}px;"
>
	<div class="meditation-content">
		<slot />
	</div>
</div>

<style>
	/* =======================
   Layout and Structure
   ======================= */
	.meditation-page {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
		height: var(--local-real-viewport-height, 100vh);
	}

	/* Apply fullscreen body styles when the class is present */
	:global(body.meditation-fullscreen) {
		overflow: hidden;
	}

	/* Apply fixed positioning ONLY when the body class is present */
	:global(body.meditation-fullscreen) .meditation-page {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 100;
		height: 100%; /* Use 100% instead of viewport unit for fixed */
		width: 100%;
	}

	.meditation-content {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		height: 100%; /* Ensure content fills the container */
		box-sizing: border-box;
		position: relative;
		z-index: 1;
		overflow: hidden; /* Prevent internal scroll */
	}

	/* Hypnosis-specific text styling */
	.hypnosis-session :global(h2) {
		text-shadow: 0 0 10px rgba(138, 43, 226, 0.3);
		transition: text-shadow 1s ease;
	}

	.hypnosis-session :global(.info-item) {
		color: var(--text-secondary);
		transition: color 1s ease;
	}

	.hypnosis-session :global(.info-item i) {
		color: rgba(186, 85, 211, 0.8);
	}

	/* =======================
	Responsive Design
	======================= */
	/* Styles remain the same - controlled by body class */
</style>
