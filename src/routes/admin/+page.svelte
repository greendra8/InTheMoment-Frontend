<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;
	export let form;

	let newPlaylist = '';

	function handleAddPlaylist() {
		newPlaylist = '';
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
		</div>
		{#each data.playlists as playlist}
			<div class="playlist-item">
				<a href="/admin/playlist/{playlist.id}">
					<i class="fas fa-folder"></i>
					{playlist.playlist_order}. {playlist.playlist_name}
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
		color: #1a1a1a;
		margin-bottom: 1.5rem;
	}

	h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.5rem;
		font-weight: 500;
		color: #1a1a1a;
		margin: 0;
	}

	h3 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.1rem;
		font-weight: 500;
		color: #1a1a1a;
		margin-bottom: 1rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.playlist-list {
		margin-bottom: 2rem;
	}

	.playlist-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		background-color: #e8e8e8;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		transition: all 0.2s ease;
	}

	.playlist-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.playlist-item a {
		padding: 1rem 1.5rem;
		text-decoration: none;
		color: #1a1a1a;
		flex-grow: 1;
		font-family: 'Inter', sans-serif;
		transition: all 0.3s ease;
	}

	.input-group {
		display: flex;
		margin-top: 1rem;
	}

	.input-group input {
		flex-grow: 1;
		padding: 0.75rem 1rem;
		background-color: #f8f8f8;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-right: none;
		border-radius: 12px 0 0 12px;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		color: #1a1a1a;
	}

	.input-group input:focus {
		outline: none;
		border-color: #1a1a1a;
	}

	button {
		padding: 0.75rem 1.25rem;
		background-color: #1a1a1a;
		color: #fff;
		border: none;
		cursor: pointer;
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.input-group button {
		border-radius: 0 12px 12px 0;
	}

	button:hover {
		background-color: #000;
	}

	.delete-btn {
		color: #666;
		background-color: transparent;
		padding: 1rem;
		transition: all 0.3s ease;
	}

	.delete-btn:hover {
		color: #e53935;
		background-color: transparent;
	}

	.error {
		margin-top: 1rem;
		padding: 0.75rem;
		background-color: #ffebee;
		color: #c62828;
		border-radius: 12px;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	@media (max-width: 480px) {
		h1 {
			font-size: 1.6rem;
			margin-bottom: 1.2rem;
		}

		.playlist-item a {
			padding: 0.75rem 1rem;
		}

		.delete-btn {
			padding: 0.75rem;
		}
	}
</style>
