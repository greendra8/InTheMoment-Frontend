<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import { text, background, ui, icon } from '$lib/theme';

	export let data: PageData;
	export let form;

	let newLessonTitle = '';
	let editingPlaylist = false;
	let playlistName = data.playlist.playlist_name;
	let playlistOrder = data.playlist.playlist_order;
	let playlistDescription = data.playlist.playlist_description || '';

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
		}
	}
</script>

<svelte:head>
	<title>Admin - {data.playlist.playlist_name}</title>
</svelte:head>

<div class="playlist-page">
	<h2>
		<i class="fas fa-folder-open"></i>
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
			>
				<input name="playlistName" bind:value={playlistName} required />
				<input name="playlistOrder" type="number" bind:value={playlistOrder} required />
				<textarea
					name="playlistDescription"
					bind:value={playlistDescription}
					placeholder="Playlist description"
				></textarea>
				<button type="submit">Save</button>
				<button type="button" on:click={toggleEditPlaylist}>Cancel</button>
			</form>
		{:else}
			{data.playlist.playlist_name}
			{#if data.playlist.playlist_description}
				<p class="playlist-description">{data.playlist.playlist_description}</p>
			{/if}
			<button on:click={toggleEditPlaylist} class="edit-button"
				><i class="fas fa-edit"></i> Edit</button
			>
		{/if}
	</h2>

	<a href="/admin" class="back-link"><i class="fas fa-arrow-left"></i> Back to Playlists</a>

	<div class="lesson-list">
		<h2>Lessons</h2>
		{#each data.lessons as lesson}
			<div class="lesson-item">
				<button on:click={() => goToLesson(lesson.id)}>
					<i class="fas fa-file-alt"></i>
					{lesson.lesson_number}. {lesson.lesson_title}
				</button>
			</div>
		{/each}
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
	h1,
	h2,
	h3 {
		margin-bottom: 20px;
	}

	.back-link {
		display: inline-block;
		margin-bottom: 20px;
		color: var(--text-primary);
		text-decoration: none;
	}

	.lesson-list {
		margin-bottom: 30px;
	}

	.lesson-item {
		margin-bottom: 10px;
	}

	.lesson-item button {
		width: 100%;
		text-align: left;
		color: var(--text-primary);
		background-color: var(--background-card);
		border: none;
		padding: 10px;
		cursor: pointer;
		transition: background-color 0.3s;
		border-radius: 5px;
	}

	.lesson-item button:hover {
		background-color: var(--background-card-hover);
	}

	.input-group {
		display: flex;
		margin-bottom: 20px;
	}

	.input-group input {
		flex-grow: 1;
		padding: 10px;
		border: 1px solid var(--ui-border);
		border-right: none;
		border-radius: 5px 0 0 5px;
		background-color: var(--background-input);
		color: var(--text-primary);
	}

	button {
		padding: 10px 15px;
		background-color: var(--ui-success);
		color: var(--text-light);
		border: none;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	button:hover {
		background-color: var(--ui-success-hover);
	}

	.edit-button {
		float: right;
	}

	.input-group button {
		border-radius: 0 5px 5px 0;
	}

	.delete-btn {
		background-color: var(--ui-danger);
		margin-top: 20px;
	}

	.delete-btn:hover {
		background-color: var(--ui-danger-hover);
	}

	.error {
		color: var(--text-error);
		margin-top: 20px;
	}

	h1 form {
		display: inline-flex;
		align-items: center;
		gap: 10px;
	}

	h1 form input {
		font-size: 1rem;
		padding: 5px;
	}

	h1 button {
		font-size: 0.8rem;
		padding: 5px 10px;
	}

	.playlist-description {
		margin-bottom: 20px;
		font-size: 0.8rem;
		font-weight: 400;
		font-style: italic;
		color: var(--text-secondary);
	}

	textarea {
		width: 100%;
		height: 100px;
		margin-bottom: 10px;
		padding: 5px;
		border: 1px solid var(--ui-border);
		border-radius: 5px;
		background-color: var(--background-input);
		color: var(--text-primary);
	}
</style>
