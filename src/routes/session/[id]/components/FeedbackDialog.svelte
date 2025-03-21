<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import SessionDialog from '$lib/components/SessionDialog/SessionDialog.svelte';

	export let isVisible: boolean;
	export let sessionId: string;
	export let userId: string;
	export let existingFeedback: string;

	const dispatch = createEventDispatcher();

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			dispatch('close');
		}
	}

	function handleFeedbackSubmit(event: CustomEvent) {
		dispatch('submit', event.detail);
	}

	function handleFeedbackFocus() {
		dispatch('focus');
	}

	function handleFeedbackBlur() {
		dispatch('blur');
	}

	function handleClose() {
		dispatch('close');
	}
</script>

{#if isVisible}
	<div class="blurred-overlay" transition:fade={{ duration: 300 }} on:click={handleOverlayClick}>
		<div class="feedback-container" on:click|stopPropagation>
			<!-- have fly out to middle of screen -->
			<div class="feedback-section">
				<SessionDialog
					mode="post"
					{sessionId}
					profileId={userId}
					{existingFeedback}
					initialQuestion="How was your meditation session? I'd love to hear about your experience."
					on:submit={handleFeedbackSubmit}
					on:focus={handleFeedbackFocus}
					on:blur={handleFeedbackBlur}
					on:close={handleClose}
				/>
			</div>
		</div>
	</div>
{/if}

<style>
	.blurred-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.9);
		display: flex;
		justify-content: center;
		align-items: flex-end;
		z-index: 800;
	}

	.feedback-container {
		padding: 0;
		max-height: 70vh;
		width: 100%;
	}

	@media (max-width: 1024px) {
		.feedback-container {
			padding: 0;
			max-height: 70vh;
		}
	}
</style>
