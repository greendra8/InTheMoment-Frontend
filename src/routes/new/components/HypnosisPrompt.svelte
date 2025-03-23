<script lang="ts">
	// Props
	export let prompt: string;
	export let onChange: (value: string) => void;
</script>

<div class="option-group prompt-group">
	<label for="hypnosis-prompt">What would you like to focus on?</label>
	<div class="prompt-input">
		<textarea
			id="hypnosis-prompt"
			placeholder="Describe what you'd like to achieve with this hypnosis session..."
			bind:value={prompt}
			on:input={() => onChange(prompt)}
			rows="3"
		></textarea>
		<div class="prompt-info">
			<i class="fas fa-info-circle"></i>
			<span>Be as detailed as possible for a tailored experience.</span>
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

	.option-group label {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'Inter', sans-serif;
	}

	/* Hypnosis Prompt */
	.prompt-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.prompt-input textarea {
		width: 100%;
		padding: 0.75rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-family: 'Inter', sans-serif;
		resize: vertical;
		min-height: 80px;
		transition: all 0.3s ease;
		box-sizing: border-box;
	}

	.prompt-input textarea:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 10px var(--ui-shadowHover);
	}

	.prompt-input textarea:focus {
		outline: none;
		border-color: rgba(var(--interactive-gradient-1), 0.4);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.2);
	}

	.prompt-info {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(var(--interactive-gradient-1), 0.05);
		border-radius: 6px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.prompt-info i {
		color: rgba(var(--interactive-gradient-1), 0.7);
		font-size: 0.9rem;
		margin-top: 0.1rem;
	}

	.prompt-info span {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.4;
		font-family: 'Inter', sans-serif;
	}
</style>
