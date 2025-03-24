<script lang="ts">
	// Props
	export let selectedPosture: string;
	export let postureOptions: { value: string; display: string; icon: string }[];
	export let onChange: (value: string) => void;
	export let constrained: boolean = false;
	export let constraintValue: string | null = null;

	// If constrained and constraint value exists
	$: effectivelyDisabled = constrained && !!constraintValue;

	// If constrained and constraint value is valid, use it and ensure it's respected
	$: if (constrained && constraintValue) {
		// Find if constraint is a valid posture option
		const validConstraint = postureOptions.find((option) => option.value === constraintValue);
		if (validConstraint && selectedPosture !== constraintValue) {
			// Force the posture to the constraint value
			selectedPosture = constraintValue;
			onChange(constraintValue);
		}
	}
</script>

<div class="option-group posture-group" class:disabled={effectivelyDisabled}>
	<div class="option-header">
		<div class="left-section">
			<label>Posture</label>
			{#if effectivelyDisabled}
				<div class="constraint-badge">
					<i class="fas fa-lock"></i>
					<span>Locked</span>
				</div>
			{/if}
		</div>
		<div class="cycle-selector" class:constrained={effectivelyDisabled}>
			<button
				type="button"
				class="cycle-btn prev"
				on:click={() => {
					if (!effectivelyDisabled) {
						const currentIndex = postureOptions.findIndex((p) => p.value === selectedPosture);
						const prevIndex = (currentIndex - 1 + postureOptions.length) % postureOptions.length;
						const newValue = postureOptions[prevIndex].value;
						selectedPosture = newValue;
						onChange(newValue);
					}
				}}
				disabled={effectivelyDisabled}
			>
				<i class="fas fa-chevron-left"></i>
			</button>
			<div class="cycle-display">
				<i class="fas {postureOptions.find((p) => p.value === selectedPosture)?.icon}"></i>
				<span>{postureOptions.find((p) => p.value === selectedPosture)?.display}</span>
			</div>
			<button
				type="button"
				class="cycle-btn next"
				on:click={() => {
					if (!effectivelyDisabled) {
						const currentIndex = postureOptions.findIndex((p) => p.value === selectedPosture);
						const nextIndex = (currentIndex + 1) % postureOptions.length;
						const newValue = postureOptions[nextIndex].value;
						selectedPosture = newValue;
						onChange(newValue);
					}
				}}
				disabled={effectivelyDisabled}
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

	.left-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
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

	/* Constraint Badge */
	.constraint-badge {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
		background: rgba(var(--interactive-gradient-1), 0.1);
		padding: 0.3rem 0.5rem;
		border-radius: 4px;
	}

	.constrained {
		opacity: 0.8;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
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

	.option-group.disabled {
		opacity: 0.7;
	}
</style>
