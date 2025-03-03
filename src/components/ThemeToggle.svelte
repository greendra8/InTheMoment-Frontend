<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/theme';
</script>

<button class="theme-toggle {$theme}" on:click={toggleTheme} aria-label="Toggle theme">
	{#if $theme === 'light'}
		<i class="fas fa-moon"></i>
	{:else if $theme === 'dark'}
		<i class="fas fa-star"></i>
	{:else}
		<i class="fas fa-sun"></i>
	{/if}
</button>

<style>
	.theme-toggle {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.2rem;
		color: var(--icon-primary);
		padding: 0.5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.theme-toggle:hover {
		background-color: var(--background-cardHover);
	}

	/* Special styling for cosmic theme */
	.theme-toggle.cosmic {
		animation: cosmic-pulse 3s infinite alternate;
	}

	.theme-toggle.cosmic i {
		animation: cosmic-rotate 8s linear infinite;
	}

	@keyframes cosmic-pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(123, 104, 238, 0.2);
		}
		100% {
			box-shadow: 0 0 0 10px rgba(123, 104, 238, 0);
		}
	}

	@keyframes cosmic-rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
