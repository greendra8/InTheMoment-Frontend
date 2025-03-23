<script lang="ts">
	// No props needed for static content
</script>

<div class="option-group settings-group">
	<label>Session Settings</label>
	<div class="settings-details">
		<div class="setting-item">
			<i class="fas fa-bed"></i>
			<span>Posture: Lying down</span>
		</div>
		<div class="setting-item">
			<i class="fas fa-eye-slash"></i>
			<span>Eyes: Closed</span>
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

	/* Settings Info for Hypnosis */
	.settings-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border-radius: 6px;
	}

	.setting-item i {
		font-size: 0.9rem;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 50%;
		color: var(--text-primary);
	}

	.setting-item span {
		font-size: 0.85rem;
		color: var(--text-primary);
		font-family: 'Inter', sans-serif;
	}
</style>
