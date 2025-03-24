<script lang="ts">
	// Props
	export let selectedPlaylist: string;
	export let playlists: any[];
	export let onChange: (value: string) => void;
	export let loading: boolean = false;

	// Function to handle selection change
	function handleChange() {
		onChange(selectedPlaylist);
	}
</script>

<div class="option-group playlist-group">
	<label for="playlist-select">Playlist (Optional)</label>
	<div class="playlist-selector" class:loading>
		<select
			id="playlist-select"
			bind:value={selectedPlaylist}
			on:change={handleChange}
			disabled={loading}
		>
			<option value="">No playlist - Custom meditation</option>
			{#each playlists as playlist}
				<option value={playlist.id}>{playlist.playlist_name}</option>
			{/each}
		</select>
		<div class="select-icon">
			{#if loading}
				<i class="fas fa-spinner fa-spin"></i>
			{:else}
				<i class="fas fa-chevron-down"></i>
			{/if}
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

	/* Playlist Selector */
	.playlist-selector {
		position: relative;
		margin-bottom: 0.5rem;
	}

	.playlist-selector.loading {
		opacity: 0.8;
	}

	.playlist-selector select {
		width: 100%;
		padding: 0.75rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.9rem;
		appearance: none;
		cursor: pointer;
		transition: all 0.3s ease;
		padding-right: 2.5rem;
		font-family: 'Inter', sans-serif;
	}

	.select-icon {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-secondary);
		pointer-events: none;
		transition: all 0.3s ease;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 50%;
	}

	.playlist-selector select:hover {
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 10px var(--ui-shadowHover);
	}

	.playlist-selector select:focus {
		outline: none;
		border-color: rgba(var(--interactive-gradient-1), 0.4);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.2);
	}

	.playlist-selector select:focus + .select-icon {
		background: rgba(var(--interactive-gradient-1), 0.2);
		color: var(--text-primary);
	}
</style>
