<script lang="ts">
	// Props
	export let onReset: () => void;
	export let buttonDisabled: boolean = false;
	export let isGenerating: boolean = false;
	export let sessionType: 'meditation' | 'hypnosis';
</script>

<div class="reset-container">
	<button type="button" class="reset-link" on:click={onReset}>
		<i class="fas fa-undo-alt"></i>
		<span>Reset</span>
	</button>

	<!-- Submit button -->
	<button type="submit" class="generate-btn" disabled={buttonDisabled}>
		<i class="fas {isGenerating ? 'fa-spinner fa-spin' : 'fa-paper-plane'}"></i>
		<span
			>{isGenerating
				? 'Generating...'
				: `Generate ${sessionType === 'meditation' ? 'Meditation' : 'Hypnosis'}`}</span
		>
	</button>
</div>

<style>
	/* Reset Container and Link */
	.reset-container {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.5rem;
	}

	.reset-link {
		align-self: flex-end;
		background: none;
		border: none;
		padding: 0.25rem 0.5rem;
		font-size: 1rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		font-family: 'Inter', sans-serif;
		line-height: 2;
	}

	.reset-link:hover {
		color: var(--text-primary);
	}

	.reset-link i {
		font-size: 1rem;
		transition: transform 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 0.8rem;
	}

	.reset-link span {
		display: inline-block;
		line-height: 1;
	}

	.reset-link:hover i {
		transform: rotate(-45deg);
	}

	/* Generate Button */
	.generate-btn {
		width: 100%;
		padding: 0.9rem;
		font-size: 1rem;
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
		position: relative;
		overflow: hidden;
	}

	.generate-btn::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 50%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transform: skewX(-25deg);
		transition: all 0.75s ease;
	}

	.generate-btn:not(:disabled):hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(var(--interactive-gradient-1), 0.25);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
	}

	.generate-btn:not(:disabled):hover::after {
		left: 100%;
	}

	.generate-btn:not(:disabled):active {
		transform: translateY(-1px);
		box-shadow: 0 4px 10px rgba(var(--interactive-gradient-1), 0.15);
	}

	.generate-btn:disabled {
		background: var(--ui-disabled);
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
		border-color: transparent;
		opacity: 0.7;
		color: var(--text-secondary);
	}

	.generate-btn:disabled::after {
		display: none;
	}

	.generate-btn i {
		font-size: 1rem;
		transition: transform 0.3s ease;
	}

	.generate-btn:not(:disabled):hover i {
		transform: translateX(3px);
	}
</style>
