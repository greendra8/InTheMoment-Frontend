<script lang="ts">
	export let user;
	export let handleNavigation;
</script>

<!-- Hero Section with Gradient Background -->
<div class="hero-section">
	<div class="hero-content">
		<div class="user-greeting">
			<h1>Welcome, {user.name === 'User' ? 'Student' : user.name}</h1>
		</div>

		<div class="hero-bottom-row">
			<p class="tagline">Your mindfulness journey</p>

			<div class="hero-actions">
				<!-- Quick Action Button -->
				<button class="primary-action-btn" on:click={() => handleNavigation('/new')}>
					<i class="fas fa-plus"></i>
					<span>New Session</span>
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	/* Typography */
	h1 {
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
		font-size: 2rem;
		letter-spacing: -0.5px;
	}

	p {
		color: var(--text-secondary);
		font-weight: 300;
	}

	/* Hero Section with Gradient */
	.hero-section {
		margin-top: 2rem;
		margin-bottom: 2rem;
		position: relative;
		overflow: hidden;
		border-radius: 16px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		box-shadow: 0 4px 20px var(--ui-shadow);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.hero-section::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(var(--interactive-gradient-1), 0.3),
			transparent
		);
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		padding: 2rem;
		position: relative;
		z-index: 1;
	}

	.user-greeting {
		width: 100%;
		margin-bottom: 0;
	}

	.hero-bottom-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		width: 100%;
	}

	.tagline {
		font-size: 1rem;
		margin: 0;
		opacity: 0.8;
	}

	.hero-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.primary-action-btn {
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 12px;
		padding: 0.6rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.15);
		position: relative;
		overflow: hidden;
	}

	.primary-action-btn:hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(var(--interactive-gradient-1), 0.25);
	}
</style>
