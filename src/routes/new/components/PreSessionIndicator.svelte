<script lang="ts">
	// Props
	export let conversationCount: number = 0;
</script>

<div class="pre-session-indicator">
	<div class="indicator-icon">
		<i class="fas fa-comment-dots"></i>
	</div>
	<div class="indicator-text">
		<span>Check-in conversation loaded</span>
		<small>{conversationCount} messages from your check-in will help personalize this session</small
		>
	</div>
</div>

<style>
	/* Pre-session indicator */
	.pre-session-indicator {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.05) 0%,
			rgba(var(--interactive-gradient-2), 0.1) 100%
		);
		border-radius: 8px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		margin-bottom: 0.5rem;
	}

	.indicator-icon {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(var(--interactive-gradient-1), 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(var(--interactive-gradient-1), 0.8);
		flex-shrink: 0;
	}

	.indicator-icon i {
		font-size: 1rem;
	}

	.indicator-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.indicator-text span {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-primary);
		font-family: 'Inter', sans-serif;
	}

	.indicator-text small {
		font-size: 0.75rem;
		color: var(--text-secondary);
		line-height: 1.4;
		font-family: 'Inter', sans-serif;
	}
</style>
