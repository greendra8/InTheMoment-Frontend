<script lang="ts">
	export let href: string = '';
	export let variant: 'primary' | 'secondary' | 'outline' = 'primary';
	export let size: 'small' | 'medium' | 'large' = 'medium';
	export let fullWidth: boolean = false;
</script>

{#if href}
	<a {href} class="button {variant} {size} {fullWidth ? 'full-width' : ''}">
		<slot />
	</a>
{:else}
	<button class="button {variant} {size} {fullWidth ? 'full-width' : ''}">
		<slot />
	</button>
{/if}

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: 'Poppins', sans-serif;
		font-weight: 500;
		text-decoration: none;
		border-radius: 8px;
		transition: all 0.3s ease;
		cursor: pointer;
		border: none;
		position: relative;
		overflow: hidden;
		text-align: center;
	}

	.button:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(123, 104, 238, 0.3);
	}

	.small {
		padding: 0.5rem 1.25rem;
		font-size: 0.875rem;
	}

	.medium {
		padding: 0.75rem 1.75rem;
		font-size: 1rem;
		min-width: 160px;
	}

	.large {
		padding: 1rem 2.5rem;
		font-size: 1.125rem;
		min-width: 200px;
	}

	.primary {
		background: linear-gradient(135deg, #7b68ee 0%, #9370db 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(123, 104, 238, 0.25);
	}

	.primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(123, 104, 238, 0.4);
		background: linear-gradient(135deg, #8a2be2 0%, #9370db 100%);
	}

	.secondary {
		background: rgba(22, 24, 35, 0.8);
		color: white;
		border: 1px solid rgba(123, 104, 238, 0.3);
	}

	.secondary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
		background: rgba(22, 24, 35, 0.9);
		border-color: rgba(123, 104, 238, 0.5);
	}

	.outline {
		background: transparent;
		color: #7b68ee;
		border: 2px solid #7b68ee;
	}

	.outline:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(123, 104, 238, 0.15);
		background: rgba(123, 104, 238, 0.1);
	}

	.full-width {
		width: 100%;
	}

	@media (max-width: 768px) {
		.medium,
		.large {
			min-width: 140px;
		}
	}
</style>
