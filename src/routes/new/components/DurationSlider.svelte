<script lang="ts">
	// Props
	export let duration: number;
	export let onChange: (value: number) => void;
</script>

<div class="option-group duration-group">
	<div class="duration-header">
		<label for="duration">Duration</label>
		<div class="duration-badge">{duration} min</div>
	</div>
	<div class="slider-container">
		<div class="slider-track">
			<div class="slider-progress" style="width: {((duration - 5) / 40) * 100}%"></div>
		</div>
		<input
			type="range"
			id="duration"
			name="duration"
			min="5"
			max="45"
			step="5"
			bind:value={duration}
			on:input={() => onChange(duration)}
		/>
	</div>
</div>

<style>
	/* Option Groups */
	.option-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Duration Slider */
	.duration-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.duration-header label {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'Inter', sans-serif;
	}

	.duration-badge {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-primary);
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.15) 0%,
			rgba(var(--interactive-gradient-2), 0.2) 100%
		);
		padding: 0.3rem 0.6rem;
		border-radius: 6px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		font-family: 'Inter', sans-serif;
	}

	.slider-container {
		position: relative;
		padding: 0 5px;
		margin: 0.25rem 0;
		height: 30px;
	}

	.slider-track {
		position: absolute;
		top: 50%;
		left: 5px;
		right: 5px;
		height: 6px;
		background: rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 3px;
		transform: translateY(-50%);
		pointer-events: none;
	}

	.slider-progress {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: var(--slider-progress-bg);
		border-radius: 3px;
		pointer-events: none;
	}

	.slider-container input {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 30px;
		background: transparent;
		outline: none;
		margin: 0;
		padding: 0;
		cursor: pointer;
		position: relative;
		z-index: 1;
	}

	.slider-container input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		background: var(--background-card);
		border: 2px solid rgba(var(--interactive-gradient-1), 0.6);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 6px var(--ui-shadow);
		transition: all 0.3s ease;
		position: relative;
		top: 0;
	}

	.slider-container input::-moz-range-thumb {
		width: 18px;
		height: 18px;
		background: var(--background-card);
		border: 2px solid rgba(var(--interactive-gradient-1), 0.6);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 6px var(--ui-shadow);
		transition: all 0.3s ease;
		position: relative;
		top: 0;
	}

	.slider-container input::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 3px 8px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.8);
	}

	.slider-container input::-moz-range-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 3px 8px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.8);
	}
</style>
