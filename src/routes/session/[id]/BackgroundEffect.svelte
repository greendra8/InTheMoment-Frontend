<script lang="ts">
	export let currentTheme: string;
	export let isHypnosis: boolean;
	export let browser: boolean;
</script>

{#if browser}
	{#if currentTheme === 'gem'}
		<div class="bg-gem-clouds {isHypnosis ? 'hypnosis-bg' : ''}"></div>
	{:else}
		<div class="bg-galaxy {isHypnosis ? 'hypnosis-bg' : ''}"></div>
	{/if}
{/if}

<style>
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

	/* Hypnosis-specific background styles */
	.hypnosis-bg.bg-gem-clouds,
	.hypnosis-bg.bg-galaxy {
		transition: background 1s ease;
	}

	.hypnosis-bg.bg-gem-clouds {
		background: linear-gradient(to bottom, var(--background-main), rgba(40, 10, 60, 1));
	}

	.hypnosis-bg.bg-galaxy {
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

	.hypnosis-bg::after {
		background:
			radial-gradient(circle at 70% 20%, rgba(186, 85, 211, 0.15) 0%, transparent 70%),
			radial-gradient(circle at 30% 80%, rgba(153, 50, 204, 0.15) 0%, transparent 70%);
	}
</style>
