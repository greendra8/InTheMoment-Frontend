<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import { text, background, ui, icon } from '$lib/theme';
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';

	export let data: PageData;
	export let form;

	let newLessonTitle = '';
	let editingPlaylist = false;
	let playlistName = data.playlist.playlist_name;
	let playlistOrder = data.playlist.playlist_order;
	let playlistDescription = data.playlist.playlist_description || '';
	let playlistVisible = data.playlist.visible || false;
	let isReorderMode = false;
	let lessons = [...data.lessons];
	let hasReordered = false;

	function goToLesson(lessonId: number) {
		goto(`/admin/lesson/${lessonId}`);
	}

	function handleAddLesson() {
		newLessonTitle = '';
	}

	function toggleEditPlaylist() {
		editingPlaylist = !editingPlaylist;
		if (!editingPlaylist) {
			playlistName = data.playlist.playlist_name;
			playlistOrder = data.playlist.playlist_order;
			playlistDescription = data.playlist.playlist_description || '';
			playlistVisible = data.playlist.visible || false;
		}
	}

	function toggleReorderMode() {
		console.log('Toggling reorder mode. Current:', isReorderMode);
		isReorderMode = !isReorderMode;
		if (!isReorderMode && hasReordered) {
			console.log('Exiting reorder mode without saving, resetting to original order');
			lessons = [...data.lessons];
			hasReordered = false;
		}
		console.log('New reorder mode state:', isReorderMode);
	}

	function handleDndConsider(e: CustomEvent<any>) {
		console.log('DND Consider event:', e.detail);
		lessons = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<any>) {
		console.log('DND Finalize event:', e.detail);
		lessons = e.detail.items;
		hasReordered = true;
		console.log('Updated lessons:', lessons);
	}

	async function saveNewOrder() {
		console.log('Starting saveNewOrder');
		console.log('Current lessons:', lessons);

		const formData = new FormData();
		const orderData = lessons.map((l, i) => ({ id: l.id, order: i + 1 }));
		formData.append('lessonOrder', JSON.stringify(orderData));

		console.log('Order data being sent:', orderData);

		try {
			console.log('Sending request to update order...');
			const response = await fetch('?/updateLessonOrder', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();
			console.log('Server response:', result);

			if (result.type === 'success') {
				console.log('Save successful, updating UI state...');
				// Update the data.lessons to match the new order
				data.lessons = [...lessons];
				console.log('Updated data.lessons:', data.lessons);

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
	<title>Admin - {data.playlist.playlist_name}</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="playlist-page">
	<div class="playlist-header">
		<div class="title-section">
			<h2>
				<i class="fas fa-folder-open"></i>
				{#if !editingPlaylist}
					{data.playlist.playlist_name}
				{/if}
			</h2>

			{#if !editingPlaylist && data.playlist.playlist_description}
				<p class="playlist-description">{data.playlist.playlist_description}</p>
			{/if}
		</div>

		{#if editingPlaylist}
			<form
				method="POST"
				action="?/updatePlaylist"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							editingPlaylist = false;
							await invalidateAll();
						}
					};
				}}
				class="edit-playlist-form"
			>
				<div class="form-group">
					<label for="playlist-name">Playlist Name</label>
					<input id="playlist-name" name="playlistName" bind:value={playlistName} required />
				</div>

				<div class="form-group">
					<label for="playlist-order">Order</label>
					<input
						id="playlist-order"
						name="playlistOrder"
						type="number"
						bind:value={playlistOrder}
						required
					/>
				</div>

				<div class="form-group">
					<label for="playlist-description">Description</label>
					<textarea
						id="playlist-description"
						name="playlistDescription"
						bind:value={playlistDescription}
						placeholder="Playlist description"
					></textarea>
				</div>

				<div class="form-group visibility-group">
					<label class="checkbox-label">
						<input
							type="checkbox"
							name="playlistVisible"
							bind:checked={playlistVisible}
							value="true"
						/>
						<span class="checkbox-text">Visible to users</span>
					</label>
					<p class="visibility-hint">
						When disabled, this playlist will only be visible in the admin interface
					</p>
				</div>

				<div class="form-actions">
					<button type="submit">Save Changes</button>
					<button type="button" class="cancel-btn" on:click={toggleEditPlaylist}>Cancel</button>
				</div>
			</form>
		{/if}
	</div>

	<div class="action-bar">
		<a href="/admin" class="back-link"><i class="fas fa-arrow-left"></i> Back to Playlists</a>

		{#if !editingPlaylist}
			<div class="action-buttons">
				<button on:click={toggleEditPlaylist} class="edit-button">
					<i class="fas fa-edit"></i> Edit Playlist
				</button>
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
		{/if}
	</div>

	<div class="lesson-list">
		<h2>Lessons</h2>
		{#if isReorderMode}
			<div class="reorder-instructions">
				<i class="fas fa-info-circle"></i>
				<span>Drag lessons to reorder them, then click "Save Order" to apply changes.</span>
			</div>
			<div
				use:dndzone={{ items: lessons, flipDurationMs: 300, type: 'lessons' }}
				on:consider={handleDndConsider}
				on:finalize={handleDndFinalize}
				class="lesson-items-container"
			>
				{#each lessons as lesson (lesson.id)}
					<div class="lesson-item reorder-mode" animate:flip={{ duration: 300 }}>
						<div class="drag-handle">
							<i class="fas fa-grip-lines"></i>
						</div>
						<div class="lesson-content">
							<i class="fas fa-file-alt"></i>
							{lesson.lesson_number}. {lesson.lesson_title}
							{#if lesson.visible === false}
								<span class="visibility-badge">Hidden</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			{#each data.lessons as lesson}
				<div class="lesson-item">
					<button on:click={() => goToLesson(lesson.id)}>
						<i class="fas fa-file-alt"></i>
						{lesson.lesson_number}. {lesson.lesson_title}
						{#if lesson.visible === false}
							<span class="visibility-badge">Hidden</span>
						{/if}
					</button>
				</div>
			{/each}
		{/if}
	</div>

	<div class="add-lesson">
		<h3>Add New Lesson</h3>
		<form
			method="POST"
			action="?/addLesson"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						handleAddLesson();
						await invalidateAll();
					}
				};
			}}
		>
			<div class="input-group">
				<input
					name="lessonTitle"
					bind:value={newLessonTitle}
					placeholder="Enter new lesson title"
					required
				/>
				<button type="submit">Add Lesson</button>
			</div>
		</form>
	</div>

	<div class="delete-playlist">
		<form
			method="POST"
			action="?/deletePlaylist"
			use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						goto('/admin');
					}
				};
			}}
		>
			<button
				type="submit"
				class="delete-btn"
				on:click|preventDefault={() => {
					if (
						confirm(
							`Are you sure you want to delete the playlist "${data.playlist.playlist_name}" and all its lessons?`
						)
					) {
						const form = document.querySelector(
							'form[action="?/deletePlaylist"]'
						) as HTMLFormElement;
						if (form) form.submit();
					}
				}}><i class="fas fa-trash"></i> Delete Playlist</button
			>
		</form>
	</div>

	{#if form?.error}
		<p class="error"><i class="fas fa-exclamation-circle"></i> {form.error}</p>
	{/if}
</div>

<style>
	.playlist-page {
		width: 100%;
		padding: 1.5rem 0;
	}

	.playlist-header {
		margin-bottom: 1.5rem;
	}

	.title-section {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.action-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		letter-spacing: -0.3px;
	}

	h2 i {
		color: var(--icon-primary);
	}

	h3 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.2rem;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 1rem;
		letter-spacing: -0.2px;
	}

	.playlist-description {
		margin: 0.5rem 0 0.75rem;
		font-size: 0.9rem;
		font-weight: 400;
		font-style: italic;
		color: var(--text-secondary);
		font-family: 'Inter', sans-serif;
		line-height: 1.5;
	}

	.edit-button {
		font-size: 0.85rem;
		padding: 0.5rem 0.75rem;
		background: var(--btn-bg);
		color: var(--btn-text);
	}

	.edit-playlist-form {
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		padding: 1.25rem;
		border-radius: 12px;
		margin-top: 1rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		box-shadow: 0 4px 15px var(--ui-shadow);
		width: 100%;
	}

	.form-group {
		margin-bottom: 1rem;
		width: 100%;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		border-radius: 8px;
		background: rgba(var(--background-card-rgb), 0.5);
		color: var(--text-primary);
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		transition: all 0.3s ease;
		box-sizing: border-box;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: rgba(var(--interactive-gradient-1), 0.4);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.2);
	}

	.form-group textarea {
		min-height: 100px;
		resize: vertical;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.cancel-btn {
		background: rgba(var(--background-card-rgb), 0.5);
		color: var(--text-secondary);
	}

	.cancel-btn:hover {
		background: rgba(var(--background-card-rgb), 0.7);
		color: var(--text-primary);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
		text-decoration: none;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		transition: all 0.3s ease;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		background: rgba(var(--interactive-gradient-1), 0.05);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.back-link:hover {
		color: var(--text-primary);
		background: rgba(var(--interactive-gradient-1), 0.1);
		transform: translateX(-3px);
	}

	.lesson-list {
		margin-bottom: 2rem;
	}

	.lesson-item {
		margin-bottom: 0.75rem;
	}

	.lesson-item button {
		width: 100%;
		text-align: left;
		color: var(--text-primary);
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		padding: 0.9rem 1.25rem;
		cursor: pointer;
		transition: all 0.3s ease;
		border-radius: 8px;
		font-family: 'Inter', sans-serif;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		box-shadow: 0 4px 15px var(--ui-shadow);
	}

	.lesson-item button i {
		color: var(--icon-primary);
	}

	.lesson-item button:hover {
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.95) 0%,
			rgba(var(--background-card-rgb), 0.85) 100%
		);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
	}

	.input-group {
		display: flex;
		margin-bottom: 1.5rem;
	}

	.input-group input {
		flex-grow: 1;
		padding: 0.75rem 1rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		border-right: none;
		border-radius: 8px 0 0 8px;
		background: rgba(var(--background-card-rgb), 0.5);
		color: var(--text-primary);
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
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
		transition: all 0.3s ease;
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: 8px;
	}

	button:hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
	}

	.delete-btn {
		background: var(--ui-danger);
		margin-top: 1.5rem;
		color: white;
	}

	.delete-btn:hover {
		background: var(--ui-danger-hover);
	}

	.action-buttons {
		display: flex;
		gap: 0.75rem;
		align-items: center;
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

	.lesson-items-container {
		min-height: 50px;
	}

	.lesson-item.reorder-mode {
		cursor: move;
		padding: 0;
		display: flex;
		align-items: center;
		margin-bottom: 0.75rem;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 4px 15px var(--ui-shadow);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
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

	.lesson-content {
		padding: 1rem;
		color: var(--text-primary);
		font-family: 'Inter', sans-serif;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-grow: 1;
	}

	.lesson-content i {
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

	.visibility-group {
		margin-top: 1rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.checkbox-text {
		font-size: 0.9rem;
		color: var(--text-primary);
		font-family: 'Inter', sans-serif;
	}

	.visibility-hint {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
		font-style: italic;
		font-family: 'Inter', sans-serif;
	}

	input[type='checkbox'] {
		width: 1rem;
		height: 1rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.3);
		border-radius: 4px;
		background: rgba(var(--background-card-rgb), 0.5);
		cursor: pointer;
	}

	input[type='checkbox']:checked {
		background: var(--ui-success);
		border-color: var(--ui-success);
	}

	.visibility-badge {
		font-size: 0.7rem;
		padding: 0.2rem 0.4rem;
		background: var(--ui-danger);
		color: white;
		border-radius: 4px;
		margin-left: 0.5rem;
		font-weight: 500;
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}
</style>
