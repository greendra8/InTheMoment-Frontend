<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { crossfade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

	const dispatch = createEventDispatcher<{
		edit: string;
		save: string;
		new: void;
		close: void;
	}>();

	export let existingFeedback: string;
	export let editingExistingFeedback = false;
	export let textResponse = existingFeedback;
	export let maxCharCount = 1000;

	let charCount = existingFeedback ? existingFeedback.length : 0;
	let textareaElement: HTMLTextAreaElement;

	// Set up crossfade transition
	const [send, receive] = crossfade({
		duration: 400,
		easing: cubicInOut,
		fallback(node) {
			return {
				duration: 400,
				easing: cubicInOut,
				css: (t) => `opacity: ${t}`
			};
		}
	});

	function updateCharCount() {
		// Enforce character limit directly when typing
		if (textResponse.length > maxCharCount) {
			textResponse = textResponse.substring(0, maxCharCount);
		}
		charCount = textResponse.length;
	}

	function startEditing() {
		textResponse = existingFeedback;
		editingExistingFeedback = true;
		dispatch('edit', textResponse);
		// Initialize textarea height after rendering
		setTimeout(() => {
			if (textareaElement) {
				const container = textareaElement.closest('.existing-feedback-content');
				if (container) {
					textareaElement.style.height = 'auto';
					// Calculate available space in the container
					const availableHeight = container.clientHeight - 40; // 40px for char count
					const newHeight = Math.min(textareaElement.scrollHeight, availableHeight);
					textareaElement.style.height = `${newHeight}px`;
				}
			}
		}, 0);
	}

	function saveEdits() {
		// Only dispatch save if the feedback has actually changed
		if (textResponse !== existingFeedback) {
			dispatch('save', textResponse);
		}
		editingExistingFeedback = false;
	}

	function cancelEdits() {
		textResponse = existingFeedback;
		editingExistingFeedback = false;
	}

	function startFreshFeedback() {
		// Signal to parent component to show rating screen and conversation
		dispatch('new');
	}

	function handleClose() {
		dispatch('close');
	}
</script>

<div
	class="existing-feedback-container"
	in:receive={{ key: 'main-content' }}
	out:send={{ key: 'main-content' }}
>
	<div class="existing-feedback-header">
		<h3>Your Previous Feedback</h3>
		<button type="button" class="close-button" on:click={handleClose}>
			<i class="fas fa-times"></i>
		</button>
	</div>

	<div class="existing-feedback-content">
		{#if editingExistingFeedback}
			<div class="textarea-container">
				<textarea
					bind:this={textareaElement}
					bind:value={textResponse}
					on:input={(e) => {
						updateCharCount();
						// Auto-resize the textarea to fit content within container bounds
						if (e.currentTarget) {
							const container = e.currentTarget.closest('.existing-feedback-content');
							if (container) {
								e.currentTarget.style.height = 'auto';
								// Calculate available space in the container
								const availableHeight = container.clientHeight - 40; // 40px for char count
								const newHeight = Math.min(e.currentTarget.scrollHeight, availableHeight);
								e.currentTarget.style.height = `${newHeight}px`;
							}
						}
					}}
					placeholder="Your feedback..."
					rows="4"
					class="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
				></textarea>
				<div class="char-count" class:warning={charCount > maxCharCount}>
					{charCount}/{maxCharCount} characters
				</div>
			</div>
		{:else}
			<p>{existingFeedback}</p>
		{/if}
	</div>

	<div class="button-container">
		{#if editingExistingFeedback}
			<button class="secondary-btn" on:click={cancelEdits}>
				<i class="fas fa-times"></i> Cancel
			</button>
			<button class="primary-btn" on:click={saveEdits}>
				<i class="fas fa-save"></i> Save Changes
			</button>
		{:else}
			<button class="secondary-btn" on:click={startEditing}>
				<i class="fas fa-edit"></i> Edit Feedback
			</button>
			<button class="primary-btn" on:click={startFreshFeedback}>
				<i class="fas fa-comment-alt"></i> New Feedback
			</button>
		{/if}
	</div>
</div>

<style>
	.existing-feedback-container {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		position: absolute;
		top: 0;
		left: 0;
	}

	.existing-feedback-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-shrink: 0;
	}

	.existing-feedback-header h3 {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 600;
		font-size: 1.25rem;
		margin: 0;
		color: var(--text-primary);
	}

	.existing-feedback-content {
		border-radius: 0.5rem;
		background: rgba(var(--background-card-rgb), 0.5);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		position: relative;
		overflow: hidden;
		margin-bottom: 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.existing-feedback-content p {
		margin: 0;
		line-height: 1.6;
		color: var(--text-primary);
		font-size: 1rem;
		font-family: 'Inter', sans-serif;
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.button-container {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: auto;
		flex-shrink: 0;
	}

	.primary-btn,
	.secondary-btn {
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.95rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.primary-btn {
		background: var(--btn-bg);
		color: var(--btn-text);
		border: none;
	}

	.primary-btn:hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
	}

	.secondary-btn {
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
	}

	.secondary-btn:hover {
		background: rgba(var(--interactive-gradient-1), 0.05);
		color: var(--text-primary);
		transform: translateY(-2px);
	}

	.close-button {
		background: none;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		font-size: 1.25rem;
		color: var(--icon-primary);
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.3s ease;
	}

	.close-button:hover {
		transform: rotate(90deg);
	}

	.text-input {
		margin-bottom: 1.5rem;
	}

	.textarea-container {
		position: relative;
		display: flex;
		flex-direction: column;
		flex: 1;
		padding: 1.5rem;
		padding-bottom: 2.5rem; /* Extra space for char count */
	}

	textarea {
		width: 100%;
		border: none;
		background: transparent;
		color: var(--text-primary);
		resize: none;
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		line-height: 1.6;
		transition: all 0.3s ease;
		box-sizing: border-box;
		outline: none;
		overflow-y: auto;
		flex: 1;
		padding: 0;
		min-height: 150px;
	}

	.char-count {
		position: absolute;
		bottom: 0.5rem;
		right: 0.75rem;
		font-size: 0.8rem;
		color: var(--text-secondary);
		background: rgba(var(--background-card-rgb), 0.7);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		transition: all 0.3s ease;
		z-index: 1;
	}

	.char-count.warning {
		color: var(--ui-danger);
		font-weight: 500;
	}

	/* Mobile styles */
	@media (max-width: 768px) {
		.existing-feedback-container {
			padding: 1rem;
		}

		.button-container {
			justify-content: space-between;
		}

		.primary-btn,
		.secondary-btn {
			font-size: 0.8rem;
		}
	}
</style>
