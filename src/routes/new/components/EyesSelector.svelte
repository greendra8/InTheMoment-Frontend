<script lang="ts">
	// Props
	export let selectedEyes: string;
	export let eyesOptions: { value: string; display: string; icon: string }[];
	export let onChange: (value: string) => void;
	export let disabled: boolean = false;
</script>

<div class="option-group eyes-group" class:disabled>
	<div class="option-header">
		<label>Eyes</label>
		<div class="cycle-selector">
			<button
				type="button"
				class="cycle-btn prev"
				on:click={() => {
					if (!disabled) {
						const currentIndex = eyesOptions.findIndex((e) => e.value === selectedEyes);
						const prevIndex = (currentIndex - 1 + eyesOptions.length) % eyesOptions.length;
						const newValue = eyesOptions[prevIndex].value;
						selectedEyes = newValue;
						onChange(newValue);
					}
				}}
				{disabled}
			>
				<i class="fas fa-chevron-left"></i>
			</button>
			<div class="cycle-display">
				<i class="fas {eyesOptions.find((e) => e.value === selectedEyes)?.icon}"></i>
				<span>{eyesOptions.find((e) => e.value === selectedEyes)?.display}</span>
			</div>
			<button
				type="button"
				class="cycle-btn next"
				on:click={() => {
					if (!disabled) {
						const currentIndex = eyesOptions.findIndex((e) => e.value === selectedEyes);
						const nextIndex = (currentIndex + 1) % eyesOptions.length;
						const newValue = eyesOptions[nextIndex].value;
						selectedEyes = newValue;
						onChange(newValue);
					}
				}}
				{disabled}
			>
				<i class="fas fa-chevron-right"></i>
			</button>
		</div>
	</div>
</div>

<style>
	/* Option Groups */
	.option-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.option-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.option-header label {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'Inter', sans-serif;
	}

	/* Cycle Selector */
	.cycle-selector {
		display: flex;
		align-items: center;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 8px;
		overflow: hidden;
	}

	.cycle-display {
		display: flex;
		align-items: center;
		padding: 0.5rem 0.75rem;
		min-width: 120px;
		justify-content: center;
		gap: 0.5rem;
	}

	.cycle-display i {
		font-size: 1rem;
		color: var(--text-primary);
	}

	.cycle-display span {
		font-size: 0.85rem;
		color: var(--text-primary);
		font-weight: 500;
		font-family: 'Inter', sans-serif;
	}

	.cycle-btn {
		background: rgba(var(--interactive-gradient-1), 0.1);
		border: none;
		color: var(--text-secondary);
		width: 30px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cycle-btn:hover:not(:disabled) {
		background: rgba(var(--interactive-gradient-1), 0.2);
		color: var(--text-primary);
	}

	.cycle-btn:active:not(:disabled) {
		background: rgba(var(--interactive-gradient-1), 0.3);
	}

	.cycle-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.eyes-group.disabled .cycle-selector {
		opacity: 0.7;
	}

	.eyes-group.disabled {
		opacity: 0.7;
	}
</style>
