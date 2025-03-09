<!-- A stack of notifications that can show multiple messages -->
<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import { fly, fade } from 'svelte/transition';
	import type { NotificationType } from '$lib/stores/notifications';

	function getIcon(type: NotificationType): string {
		switch (type) {
			case 'success':
				return 'fa-check-circle';
			case 'error':
				return 'fa-exclamation-circle';
			case 'info':
				return 'fa-info-circle';
			case 'loading':
				return 'fa-spinner fa-spin';
			default:
				return 'fa-bell';
		}
	}
</script>

<div class="notifications-container">
	{#each $notifications as notification (notification.id)}
		<div
			class="notification"
			class:success={notification.type === 'success'}
			class:error={notification.type === 'error'}
			class:info={notification.type === 'info'}
			class:loading={notification.type === 'loading'}
			transition:fly={{ y: 50, duration: 300 }}
			on:click={() => notification.action?.onClick?.()}
		>
			<div class="content">
				<i class="fas {getIcon(notification.type)}"></i>
				<span>{notification.message}</span>
			</div>

			{#if notification.action}
				<div class="action" on:click|stopPropagation={notification.action.onClick}>
					<span>{notification.action.label}</span>
					<span class="arrow">→</span>
				</div>
			{/if}

			{#if notification.dismissible}
				<button
					class="dismiss"
					on:click|stopPropagation={() => notifications.remove(notification.id)}
					transition:fade
				>
					<i class="fas fa-times"></i>
				</button>
			{/if}
		</div>
	{/each}
</div>

<style>
	.notifications-container {
		position: fixed;
		top: 2rem;
		right: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		z-index: 1000;
		pointer-events: none;
	}

	.notification {
		background: var(--background-card);
		padding: 1rem 1.5rem;
		border-radius: 12px;
		box-shadow: 0 4px 12px var(--ui-shadow);
		display: flex;
		align-items: center;
		gap: 1rem;
		border: 1px solid rgba(0, 0, 0, 0.1);
		max-width: 90vw;
		pointer-events: auto;
		position: relative;
	}

	.notification.success {
		background: var(--background-button);
		color: var(--text-light);
	}

	.notification.error {
		background: #e53935;
		color: white;
	}

	.notification.info {
		background: var(--background-card);
		color: var(--text-primary);
	}

	.notification.loading {
		background: var(--background-card);
		color: var(--text-primary);
	}

	.content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-right: 0.5rem;
		flex: 1;
	}

	.content i {
		font-size: 1.1rem;
	}

	.content span {
		font-size: 0.9rem;
		font-weight: 500;
	}

	.action {
		font-size: 0.8rem;
		opacity: 0.9;
		padding-left: 0.75rem;
		border-left: 1px solid rgba(255, 255, 255, 0.2);
		cursor: pointer;
		display: flex;
		align-items: center;
		white-space: nowrap;
		gap: 0.25rem;
		padding-right: 0.5rem;
	}

	.action .arrow {
		display: inline-block;
	}

	.dismiss {
		position: absolute;
		top: 50%;
		right: 0.5rem;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: inherit;
		opacity: 0.6;
		cursor: pointer;
		padding: 0.25rem;
		margin-left: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		width: 24px;
		height: 24px;
	}

	.dismiss:hover {
		opacity: 1;
		background: rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 480px) {
		.notifications-container {
			font-size: 0.8rem;
			top: unset;
			bottom: calc(6.5rem + env(safe-area-inset-bottom, 1rem));
			right: 1rem;
			left: 1rem;
		}

		.notification {
			max-width: unset;
		}
	}
</style>
