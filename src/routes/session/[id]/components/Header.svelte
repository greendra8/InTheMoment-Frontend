<script lang="ts">
	export let title: string;
	export let theme: string;
	export let difficulty: string;
	export let contentType: string;
	export let playlistId: string | null = null;
	export let playlistName: string | null = null;
	export let listened: boolean;
	export let isCompletedThisSession: boolean;
	export let isHypnosis: boolean;
</script>

<header>
	<div class="header-content">
		<h2>
			<span class="title-wrapper">
				{#if listened || isCompletedThisSession}
					<span class="listened-icon" title="You've listened to this session before">
						<i class="fas fa-check-circle"></i>
					</span>
				{/if}
				{title}
			</span>
		</h2>
		<div class="session-info">
			<div class="session-type-indicator">
				<span class="session-type-badge" class:hypnosis={isHypnosis}>
					{contentType === 'hypnosis' ? 'Hypnosis' : 'Meditation'}
				</span>
			</div>
			<div class="meditation-info">
				<span class="info-item info-item-playlist">
					<i class="fas fa-layer-group"></i>
					{#if playlistId && playlistName}
						<a href="/playlists/{playlistId}">{playlistName}</a>
					{:else}
						{theme}
					{/if}
				</span>
				<span class="info-item info-item-difficulty">
					<i class="fas fa-signal"></i>{' '}
					{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
				</span>
			</div>
		</div>
	</div>
</header>

<style>
	header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		padding: 1rem;
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		text-align: center;
		z-index: 2;
		padding-top: clamp(3rem, 10vh, 4rem);
	}

	.header-content {
		max-width: 500px;
	}

	h2 {
		font-family: 'Space Grotesk', sans-serif;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: clamp(0.3rem, 2vw, 0.5rem);
	}

	.title-wrapper {
		font-family: 'Space Grotesk', sans-serif;
		position: relative;
		display: inline-block;
		padding-top: clamp(1.5rem, 4vw, 2rem);
	}

	.listened-icon {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		font-size: clamp(0.8rem, 2.5vw, 0.9rem);
		color: #4caf50;
	}

	.listened-icon i {
		border-radius: 50%;
	}

	.meditation-info {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: clamp(0.5rem, 2vw, 1rem);
		font-size: clamp(0.875rem, 2.5vw, 1rem);
		color: var(--text-secondary);
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.info-item a {
		text-decoration: none;
		background: var(--text-secondary);
		border-radius: 1rem;
		padding: 0 8px;
		color: var(--background-card);
	}

	/* Session Type Badge */
	.session-type-indicator {
		display: flex;
		justify-content: center;
		margin-top: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.session-type-badge {
		font-size: 0.8rem;
		padding: 0.3rem 0.8rem;
		border-radius: 12px;
		background: var(--meditation-badge-bg);
		color: var(--meditation-badge-text);
		font-weight: 500;
		text-transform: capitalize;
		letter-spacing: 0.5px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.session-type-badge.hypnosis {
		background: var(--hypnosis-badge-bg);
		color: var(--hypnosis-badge-text);
		border: 1px solid rgba(186, 85, 211, 0.2);
		box-shadow: 0 0 10px rgba(138, 43, 226, 0.2);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		header {
			width: 100%;
		}
		.header-content {
			max-width: 100%;
		}
		.session-info {
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			flex-direction: row-reverse;
		}
		.session-type-indicator {
			margin-left: 0.5rem;
		}
		.session-type-badge {
			margin-bottom: -3px;
		}
		.info-item a {
			padding: 0.2rem 0.5rem;
		}
		.info-item-difficulty {
			display: none;
		}
	}

	/* @media (max-height: 700px) {
		header {
			padding-top: 2rem;
		}

		h2 {
			font-size: 1.5rem;
		}

		.title-wrapper {
			padding-top: 1rem;
		}

		.listened-icon {
			top: -0.5rem;
		}
	} */
</style>
