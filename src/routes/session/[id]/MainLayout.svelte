<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let currentTheme: string;
	export let isFullscreen: boolean;
	export let isFeedbackVisible: boolean;
	export let isHypnosis: boolean;
	export let realViewportHeight: number;

	// Handle outside click for menu
	export let handleOutsideClick: (event: MouseEvent) => void;

	onMount(() => {
		document.addEventListener('click', handleOutsideClick);

		// Apply fullscreen class to body
		updateFullscreenClass();

		return () => {
			document.removeEventListener('click', handleOutsideClick);
		};
	});

	// Update body class when fullscreen changes
	function updateFullscreenClass() {
		if (isFullscreen) {
			document.body.classList.add('meditation-fullscreen');
		} else {
			document.body.classList.remove('meditation-fullscreen');
		}
	}

	// Watch for changes to isFullscreen
	$: if (typeof document !== 'undefined') {
		isFullscreen && updateFullscreenClass();
		!isFullscreen && updateFullscreenClass();
	}
</script>

<div
	class="meditation-page {currentTheme}-theme {isFullscreen ? 'fullscreen' : ''} {isFeedbackVisible
		? 'feedback-open'
		: ''} {isHypnosis ? 'hypnosis-session' : ''}"
	style="height: {realViewportHeight}px;"
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
		justify-content: space-between;
		overflow: hidden;
		position: relative;
		height: var(--real-viewport-height, 100vh);
	}

	:global(body.meditation-fullscreen .meditation-page) {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 100;
		height: 100vh;
	}

	.meditation-content {
		display: flex;
		flex-direction: column;
		height: var(--real-viewport-height, 100vh);
		box-sizing: border-box;
		position: relative;
		z-index: 1;
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
	@media (max-width: 1024px) {
		.meditation-page {
			margin: 0 -1rem;
			position: static;
		}

		.meditation-content {
			padding: clamp(0.5rem, 2vw, 0.625rem);
		}
	}
</style>
