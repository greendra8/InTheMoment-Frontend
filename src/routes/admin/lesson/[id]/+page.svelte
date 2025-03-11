<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageData, ActionData } from './$types';
	import { text, background, ui, icon } from '$lib/theme';

	export let data: PageData;
	export let form: ActionData;

	let { lesson } = data;
	let isUpdating = false;
	let updateSuccess = false;
	let lessonVisible = lesson.visible || false;

	function handleUpdate() {
		isUpdating = true;
		updateSuccess = false;

		return async ({
			result,
			update
		}: {
			result: any;
			update: (options?: { reset: boolean }) => Promise<void>;
		}) => {
			isUpdating = false;
			if (result.type === 'success') {
				updateSuccess = true;

				// Check if result.data and result.data.lesson exist before assigning
				if (result.data && result.data.lesson) {
					lesson = result.data.lesson;
					lessonVisible = lesson.visible || false;
				} else {
					// If the structure is different, refresh the page data
					console.log('Refreshing page data after successful update');
					await invalidateAll();
				}
			}
			await update({ reset: false });
		};
	}
</script>

<svelte:head>
	<title>Edit Lesson - {lesson.lesson_title}</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="lesson-edit">
	<h1><i class="fas fa-edit"></i> Edit Lesson</h1>
	<a href="/admin/playlist/{lesson.playlist_id}" class="back-link">
		<i class="fas fa-arrow-left"></i> Back to Playlist
	</a>

	<form method="POST" action="?/updateLesson" use:enhance={handleUpdate}>
		<div class="form-group">
			<label for="lesson_title">Lesson Title</label>
			<input id="lesson_title" name="lesson_title" bind:value={lesson.lesson_title} required />
		</div>

		<div class="form-group">
			<label for="lesson_number">Lesson Number</label>
			<input
				id="lesson_number"
				name="lesson_number"
				type="number"
				bind:value={lesson.lesson_number}
				required
			/>
		</div>

		<div class="form-group">
			<label for="lesson_techniques">Lesson Techniques</label>
			<textarea
				id="lesson_techniques"
				name="lesson_techniques"
				bind:value={lesson.lesson_techniques}
				placeholder="Default techniques"
			/>
		</div>

		<div class="form-group visibility-group">
			<label class="checkbox-label">
				<input type="checkbox" name="lessonVisible" bind:checked={lessonVisible} value="true" />
				<span class="checkbox-text">Visible to users</span>
			</label>
			<p class="visibility-hint">
				When disabled, this lesson will only be visible in the admin interface
			</p>
		</div>

		<div class="form-group">
			<label for="lesson_content">Lesson Content</label>
			<textarea
				id="lesson_content"
				name="lesson_content"
				bind:value={lesson.lesson_content}
				rows="28"
				required
			></textarea>
		</div>

		{#if updateSuccess}
			<p class="success"><i class="fas fa-check-circle"></i> Lesson updated successfully!</p>
		{/if}
		{#if form?.error}
			<p class="error"><i class="fas fa-exclamation-circle"></i> {form.error}</p>
		{/if}

		<button type="submit" disabled={isUpdating} class="update-button">
			{#if isUpdating}
				<i class="fas fa-spinner fa-spin"></i> Updating...
			{:else}
				<i class="fas fa-save"></i> Update Lesson
			{/if}
		</button>
	</form>

	<form
		method="POST"
		action="?/deleteLesson"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') {
					goto(`/admin/playlist/${lesson.playlist_id}`);
				}
			};
		}}
	>
		<button
			type="submit"
			class="delete-button"
			on:click|preventDefault={() => {
				if (confirm('Are you sure you want to delete this lesson?')) {
					const form = document.querySelector('form[action="?/deleteLesson"]') as HTMLFormElement;
					if (form) form.submit();
				}
			}}
		>
			<i class="fas fa-trash"></i> Delete Lesson
		</button>
	</form>
</div>

<style>
	.lesson-edit {
		width: 100%;
		padding: 1.5rem 0;
	}

	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.1);
	}

	h1 i {
		color: var(--icon-primary);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
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

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	input,
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		border-radius: 8px;
		box-sizing: border-box;
		background: rgba(var(--background-card-rgb), 0.5);
		color: var(--text-primary);
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		transition: all 0.3s ease;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: rgba(var(--interactive-gradient-1), 0.4);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.2);
	}

	textarea {
		min-height: 100px;
		resize: vertical;
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

	button:hover:not(:disabled) {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
	}

	button:disabled {
		background: var(--ui-disabled);
		cursor: not-allowed;
		opacity: 0.7;
		color: var(--text-secondary);
	}

	.update-button {
		float: right;
		margin-top: 1rem;
	}

	.delete-button {
		float: left;
		margin-top: 1rem;
		background: var(--ui-danger);
		color: white;
	}

	.delete-button:hover {
		background: var(--ui-danger-hover);
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

	.success {
		margin-top: 1rem;
		padding: 0.75rem;
		background: rgba(var(--ui-success), 0.1);
		color: var(--ui-success);
		border-radius: 8px;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid rgba(var(--ui-success), 0.2);
		box-shadow: 0 4px 10px rgba(var(--ui-success), 0.1);
	}

	.visibility-group {
		margin-top: 1rem;
		margin-bottom: 1.5rem;
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
</style>
