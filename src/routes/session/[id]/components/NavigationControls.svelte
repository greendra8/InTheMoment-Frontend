<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let isFullscreen: boolean;
	export let isFeedbackVisible: boolean;
	export let isMenuOpen: boolean;

	const dispatch = createEventDispatcher();

	function goBack() {
		if (!isFeedbackVisible) {
			window.history.back();
		}
	}

	function toggleFullscreen() {
		if (!isFeedbackVisible) {
			dispatch('toggleFullscreen');
		}
	}

	function toggleMenu() {
		if (!isFeedbackVisible) {
			dispatch('toggleMenu');
		}
	}
</script>

<div class="navigation-controls {isFeedbackVisible ? 'blurred' : ''}">
	<div class="back-icon" on:click={goBack}>
		<i class="fas fa-arrow-left"></i> <span class="back-text">Back</span>
	</div>
	<div class="fullscreen-icon" on:click={toggleFullscreen}>
		<i class="fas {isFullscreen ? 'fa-compress' : 'fa-expand'}"></i>
	</div>
	<div class="menu-icon" on:click|stopPropagation={toggleMenu}>
		<i class="fas fa-ellipsis-h"></i>
	</div>
</div>

<style>
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
	}

	.menu-icon:hover {
		transform: translateY(-2px);
	}

	.menu-icon i {
		font-size: clamp(1.5rem, 4vw, 1.8rem);
		color: var(--text-primary);
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
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
	}
</style>
