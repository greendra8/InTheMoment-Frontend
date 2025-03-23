<script lang="ts">
	// Props
	export let sessionType: 'meditation' | 'hypnosis';
	export let onSelect: (type: 'meditation' | 'hypnosis') => void;
</script>

<div class="session-type-selector">
	<button
		class:active={sessionType === 'meditation'}
		on:click={() => onSelect('meditation')}
		class="meditation-btn"
	>
		Meditation
	</button>
	<button
		class:active={sessionType === 'hypnosis'}
		on:click={() => onSelect('hypnosis')}
		class="hypnosis-btn"
	>
		Hypnosis
	</button>
</div>

<style>
	/* Session Type Selector */
	.session-type-selector {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.session-type-selector button {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-secondary);
		font-family: 'Inter', sans-serif;
	}

	.session-type-selector button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 10px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
	}

	.session-type-selector button.meditation-btn.active {
		background: var(--meditation-badge-bg);
		color: var(--meditation-badge-text);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
	}

	.session-type-selector button.hypnosis-btn.active {
		background: var(--hypnosis-badge-bg);
		color: var(--hypnosis-badge-text);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
	}
</style>
