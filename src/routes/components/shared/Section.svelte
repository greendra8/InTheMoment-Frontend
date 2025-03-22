<script lang="ts">
	export let title: string = '';
	export let subtitle: string = '';
	export let centered: boolean = false;
	export let dark: boolean = false;
	export let padding: 'small' | 'medium' | 'large' = 'medium';
</script>

<section class="section {padding} {dark ? 'dark' : ''}">
	<div class="container">
		{#if title}
			<h2 class="title {centered ? 'centered' : ''}">{title}</h2>
		{/if}
		{#if subtitle}
			<p class="subtitle {centered ? 'centered' : ''}">{subtitle}</p>
		{/if}
		<div class="content">
			<slot />
		</div>
	</div>
</section>

<style>
	.section {
		width: 100%;
		position: relative;
		overflow: hidden;
		box-sizing: border-box;
	}

	.section.dark {
		background: rgba(18, 18, 30, 0.7);
	}

	.section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(123, 104, 238, 0.3), transparent);
	}

	.small {
		padding: 3rem 1rem;
	}

	.medium {
		padding: 5rem 1rem;
	}

	.large {
		padding: 7rem 1rem;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		z-index: 1;
		position: relative;
	}

	.title {
		font-size: clamp(1.8rem, 4vw, 2.5rem);
		margin-bottom: 1rem;
		color: var(--text-primary, white);
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		position: relative;
		display: inline-block;
	}

	.title.centered {
		text-align: center;
		display: block;
	}

	.title::after {
		content: '';
		position: absolute;
		bottom: -8px;
		left: 0;
		width: 60px;
		height: 3px;
		background: linear-gradient(90deg, #7b68ee, #9370db);
		border-radius: 2px;
	}

	.title.centered::after {
		left: 50%;
		transform: translateX(-50%);
	}

	.subtitle {
		font-size: clamp(1rem, 2vw, 1.2rem);
		max-width: 800px;
		margin: 1.5rem 0 2.5rem;
		color: var(--text-secondary, rgba(255, 255, 255, 0.8));
		line-height: 1.6;
	}

	.subtitle.centered {
		text-align: center;
		margin-left: auto;
		margin-right: auto;
	}

	.content {
		margin-top: 1rem;
	}

	@media (max-width: 768px) {
		.small {
			padding: 2rem 1rem;
		}

		.medium {
			padding: 3.5rem 1rem;
		}

		.large {
			padding: 5rem 1rem;
		}
	}
</style>
