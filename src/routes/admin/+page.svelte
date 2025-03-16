<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import { text, background, ui, icon } from '$lib/theme';
	import { flip } from 'svelte/animate';
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action';

	export let data: PageData;
	export let form;

	let newPlaylist = '';
	let isReorderMode = false;
	let playlists = [...data.playlists];
	let hasReordered = false;

	function handleAddPlaylist() {
		newPlaylist = '';
	}

	function toggleReorderMode() {
		console.log('Toggling reorder mode. Current:', isReorderMode);
		isReorderMode = !isReorderMode;
		if (!isReorderMode && hasReordered) {
			console.log('Exiting reorder mode without saving, resetting to original order');
			playlists = [...data.playlists];
			hasReordered = false;
		}
		console.log('New reorder mode state:', isReorderMode);
	}

	function handleDndConsider(e: CustomEvent<any>) {
		console.log('DND Consider event:', e.detail);
		playlists = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<any>) {
		console.log('DND Finalize event:', e.detail);
		playlists = e.detail.items;
		hasReordered = true;
		console.log('Updated playlists:', playlists);
	}

	async function saveNewOrder() {
		console.log('Starting saveNewOrder');
		console.log('Current playlists:', playlists);

		const formData = new FormData();
		const orderData = playlists.map((p, i) => ({ id: p.id, order: i + 1 }));
		formData.append('playlistOrder', JSON.stringify(orderData));

		console.log('Order data being sent:', orderData);

		try {
			console.log('Sending request to update order...');
			const response = await fetch('?/updatePlaylistOrder', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			console.log('Server response:', result);

			if (result.type === 'success') {
				console.log('Save successful, updating UI state...');
				// Update the data.playlists to match the new order
				data.playlists = [...playlists];
				console.log('Updated data.playlists:', data.playlists);

				// Exit reorder mode
				isReorderMode = false;
				hasReordered = false;
				console.log('Reset reorder mode flags');

				// Refresh the page data
				console.log('Calling invalidateAll...');
				await invalidateAll();
				console.log('invalidateAll completed');
			} else {
				console.error('Save failed:', result.error);
			}
		} catch (err) {
			console.error('Error in saveNewOrder:', err);
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="admin-dashboard">
	<h1>Admin Dashboard</h1>

	<div class="playlist-list">
		<div class="section-header">
			<h2>Playlists</h2>
			<div class="section-actions">
				<button class="reorder-btn" on:click={toggleReorderMode}>
					{#if isReorderMode}
						<i class="fas fa-times"></i> Cancel
					{:else}
						<i class="fas fa-sort"></i> Reorder
					{/if}
				</button>
				{#if isReorderMode && hasReordered}
					<button class="save-order-btn" on:click={saveNewOrder}>
						<i class="fas fa-save"></i> Save Order
					</button>
				{/if}
			</div>
		</div>

		{#if isReorderMode}
			<div class="reorder-instructions">
				<i class="fas fa-info-circle"></i>
				<span>Drag playlists to reorder them, then click "Save Order" to apply changes.</span>
			</div>
			<div
				use:dndzone={{ items: playlists, flipDurationMs: 300, type: 'playlists' }}
				on:consider={handleDndConsider}
				on:finalize={handleDndFinalize}
				class="playlist-items-container"
			>
				{#each playlists as playlist (playlist.id)}
					<div class="playlist-item reorder-mode" animate:flip={{ duration: 300 }}>
						<div class="drag-handle">
							<i class="fas fa-grip-lines"></i>
						</div>
						<div class="playlist-content">
							<i class="fas fa-folder"></i>
							{playlist.playlist_order}. {playlist.playlist_name}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			{#each data.playlists as playlist}
				<div class="playlist-item">
					<a href="/admin/playlist/{playlist.id}">
						<i class="fas fa-folder"></i>
						{playlist.playlist_order}. {playlist.playlist_name}
						{#if !playlist.visible}
							<span class="visibility-badge">Hidden</span>
						{/if}
					</a>
					<form
						method="POST"
						action="?/deletePlaylist"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success') {
									await invalidateAll();
								}
							};
						}}
					>
						<input type="hidden" name="playlistId" value={playlist.id} />
						<button type="submit" class="delete-btn" title="Delete Playlist">
							<i class="fas fa-trash"></i>
						</button>
					</form>
				</div>
			{/each}
		{/if}
	</div>

	<div class="add-playlist">
		<h3>Add New Playlist</h3>
		<form
			method="POST"
			action="?/addPlaylist"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						handleAddPlaylist();
						await invalidateAll();
					}
				};
			}}
		>
			<div class="input-group">
				<input
					name="playlist"
					bind:value={newPlaylist}
					placeholder="Enter new playlist name"
					required
				/>
				<button type="submit">Add Playlist</button>
			</div>
		</form>
	</div>

	{#if form?.error}
		<p class="error"><i class="fas fa-exclamation-circle"></i> {form.error}</p>
	{/if}
</div>

<style>
	.admin-dashboard {
		width: 100%;
		padding: 1.5rem 0;
	}

	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.1);
	}

	h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0;
		letter-spacing: -0.3px;
	}

	h3 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 1rem;
		letter-spacing: -0.2px;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		position: relative;
	}

	.section-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.section-header::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 0;
		width: 30px;
		height: 2px;
		background: linear-gradient(
			90deg,
			rgba(var(--interactive-gradient-1), 0.6),
			rgba(var(--interactive-gradient-1), 0)
		);
		border-radius: 2px;
	}

	.playlist-list {
		margin-bottom: 2rem;
	}

	.playlist-items-container {
		min-height: 50px;
	}

	.playlist-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 15px var(--ui-shadow);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		transition: all 0.3s ease;
		position: relative;
	}

	.playlist-item.reorder-mode {
		cursor: move;
		padding: 0;
		display: flex;
		align-items: center;
	}

	.drag-handle {
		padding: 1rem;
		color: var(--icon-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(var(--interactive-gradient-1), 0.05);
		height: 100%;
	}

	.playlist-content {
		padding: 1rem;
		color: var(--text-primary);
		font-family: 'Inter', sans-serif;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-grow: 1;
	}

	.playlist-content i {
		color: var(--icon-primary);
	}

	.reorder-instructions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		margin-bottom: 1rem;
		background: rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 8px;
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		color: var(--text-secondary);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
	}

	.reorder-instructions i {
		color: rgba(var(--interactive-gradient-1), 0.7);
	}

	.playlist-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
	}

	.playlist-item a {
		padding: 1rem 1.5rem;
		text-decoration: none;
		color: var(--text-primary);
		flex-grow: 1;
		font-family: 'Inter', sans-serif;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.playlist-item a i {
		color: var(--icon-primary);
		font-size: 1rem;
	}

	.input-group {
		display: flex;
		margin-top: 1rem;
	}

	.input-group input {
		flex-grow: 1;
		padding: 0.75rem 1rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		border-right: none;
		border-radius: 8px 0 0 8px;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		color: var(--text-primary);
		transition: all 0.3s ease;
	}

	.input-group input:focus {
		outline: none;
		border-color: rgba(var(--interactive-gradient-1), 0.4);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.2);
	}

	button {
		padding: 0.75rem 1.25rem;
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		cursor: pointer;
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border-radius: 8px;
	}

	.reorder-btn {
		font-size: 0.85rem;
		padding: 0.5rem 0.75rem;
	}

	.save-order-btn {
		font-size: 0.85rem;
		padding: 0.5rem 0.75rem;
		background: var(--ui-success);
		color: white;
	}

	.save-order-btn:hover {
		background: var(--ui-success-hover);
	}

	.input-group button {
		border-radius: 0 8px 8px 0;
		border-left: none;
	}

	button:hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
	}

	.delete-btn {
		color: var(--icon-secondary);
		background: transparent;
		padding: 1rem;
		transition: all 0.3s ease;
		border: none;
	}

	.delete-btn:hover {
		color: var(--icon-danger);
		background: transparent;
		transform: none;
		box-shadow: none;
	}

	.error {
		margin-top: 1rem;
		padding: 0.75rem;
		background: var(--background-error);
		color: var(--text-error);
		border-radius: 8px;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid rgba(var(--ui-danger), 0.2);
		box-shadow: 0 4px 10px rgba(var(--ui-danger), 0.1);
	}

	.visibility-badge {
		font-size: 0.7rem;
		padding: 0.2rem 0.4rem;
		background: rgba(var(--interactive-gradient-1), 0.1);
		color: var(--text-secondary);
		border-radius: 4px;
		margin-left: 0.5rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		font-family: 'Inter', sans-serif;
	}

	@media (max-width: 480px) {
		h1 {
			font-size: 1.75rem;
			margin-bottom: 1.25rem;
		}

		.playlist-item a {
			padding: 0.75rem 1rem;
		}

		.delete-btn {
			padding: 0.75rem;
		}

		.section-actions {
			flex-direction: column;
			gap: 0.5rem;
			align-items: flex-end;
		}
	}
</style>
