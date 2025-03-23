<script lang="ts">
	export let currentTimeOfDay;
	export let hasMorningSession;
	export let hasMiddaySession;
	export let hasEveningSession;
	export let morningSession;
	export let middaySession;
	export let eveningSession;
	export let handleNavigation;
</script>

<section class="content-section">
	<div class="section-header">
		<h2>Today's Practices</h2>
	</div>

	<div class="today-practice">
		<!-- Current time period section -->
		{#if !((currentTimeOfDay === 'morning' && hasMorningSession) || (currentTimeOfDay === 'midday' && hasMiddaySession) || (currentTimeOfDay === 'evening' && hasEveningSession))}
			<div
				class="current-period-card"
				on:click={() => handleNavigation('/new')}
				on:keydown={(e) => e.key === 'Enter' && handleNavigation('/new')}
				tabindex="0"
				role="button"
			>
				<div class="period-icon">
					<i
						class="fas fa-{currentTimeOfDay === 'morning'
							? 'sun'
							: currentTimeOfDay === 'midday'
								? 'cloud-sun'
								: 'moon'}"
					></i>
				</div>
				<div class="period-info">
					<h3>
						{currentTimeOfDay === 'morning'
							? 'Morning'
							: currentTimeOfDay === 'midday'
								? 'Midday'
								: 'Evening'} Check-in
					</h3>
					<p>It's time for some {currentTimeOfDay} mindfulness!</p>
				</div>
				<div class="mindfulness-btn">
					<i class="fas fa-pen-field"></i>
				</div>
			</div>
		{/if}

		<!-- Sessions timeline -->
		<div class="practice-sessions">
			{#if hasEveningSession}
				<div
					class="practice-session"
					on:click={() => handleNavigation(`/session/${eveningSession.id}`)}
					on:keydown={(e) => e.key === 'Enter' && handleNavigation(`/session/${eveningSession.id}`)}
					tabindex="0"
					role="button"
					style="--bg-pattern: url('{eveningSession.bgPattern}')"
				>
					<div class="practice-session-header">
						<div class="practice-time">
							<i class="fas fa-moon"></i>
							<span>Evening</span>
						</div>
						<div class="session-indicators">
							{#if eveningSession.listened}
								<i class="fas fa-check-circle listened-icon"></i>
							{/if}
							<span
								class="content-type-badge"
								class:hypnosis={eveningSession.content_type === 'hypnosis'}
							>
								{eveningSession.content_type === 'hypnosis' ? 'Hypnosis' : 'Meditation'}
							</span>
						</div>
					</div>
					<h3 class="practice-title">{eveningSession.title || 'Evening Session'}</h3>
					<div class="practice-meta">
						<span><i class="far fa-clock"></i> {eveningSession.length} min</span>
						<span class="meta-divider">•</span>
						<span
							>{new Date(eveningSession.created_at).toLocaleTimeString([], {
								hour: '2-digit',
								minute: '2-digit'
							})}</span
						>
					</div>
					<div class="play-button">
						<i class="fas fa-play"></i>
					</div>
				</div>
			{/if}

			{#if hasMiddaySession}
				<div
					class="practice-session"
					on:click={() => handleNavigation(`/session/${middaySession.id}`)}
					on:keydown={(e) => e.key === 'Enter' && handleNavigation(`/session/${middaySession.id}`)}
					tabindex="0"
					role="button"
					style="--bg-pattern: url('{middaySession.bgPattern}')"
				>
					<div class="practice-session-header">
						<div class="practice-time">
							<i class="fas fa-cloud-sun"></i>
							<span>Midday</span>
						</div>
						<div class="session-indicators">
							{#if middaySession.listened}
								<i class="fas fa-check-circle listened-icon"></i>
							{/if}
							<span
								class="content-type-badge"
								class:hypnosis={middaySession.content_type === 'hypnosis'}
							>
								{middaySession.content_type === 'hypnosis' ? 'Hypnosis' : 'Meditation'}
							</span>
						</div>
					</div>
					<h3 class="practice-title">{middaySession.title || 'Midday Session'}</h3>
					<div class="practice-meta">
						<span><i class="far fa-clock"></i> {middaySession.length} min</span>
						<span class="meta-divider">•</span>
						<span
							>{new Date(middaySession.created_at).toLocaleTimeString([], {
								hour: '2-digit',
								minute: '2-digit'
							})}</span
						>
					</div>
					<div class="play-button">
						<i class="fas fa-play"></i>
					</div>
				</div>
			{/if}

			{#if hasMorningSession}
				<div
					class="practice-session"
					on:click={() => handleNavigation(`/session/${morningSession.id}`)}
					on:keydown={(e) => e.key === 'Enter' && handleNavigation(`/session/${morningSession.id}`)}
					tabindex="0"
					role="button"
					style="--bg-pattern: url('{morningSession.bgPattern}')"
				>
					<div class="practice-session-header">
						<div class="practice-time">
							<i class="fas fa-sun"></i>
							<span>Morning</span>
						</div>
						<div class="session-indicators">
							{#if morningSession.listened}
								<i class="fas fa-check-circle listened-icon"></i>
							{/if}
							<span
								class="content-type-badge"
								class:hypnosis={morningSession.content_type === 'hypnosis'}
							>
								{morningSession.content_type === 'hypnosis' ? 'Hypnosis' : 'Meditation'}
							</span>
						</div>
					</div>
					<h3 class="practice-title">{morningSession.title || 'Morning Session'}</h3>
					<div class="practice-meta">
						<span><i class="far fa-clock"></i> {morningSession.length} min</span>
						<span class="meta-divider">•</span>
						<span
							>{new Date(morningSession.created_at).toLocaleTimeString([], {
								hour: '2-digit',
								minute: '2-digit'
							})}</span
						>
					</div>
					<div class="play-button">
						<i class="fas fa-play"></i>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	/* Typography */
	h2,
	h3 {
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
	}

	h2 {
		font-size: 1.5rem;
		letter-spacing: -0.3px;
		position: relative;
		display: inline-block;
	}

	h2::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 0;
		width: 30px;
		height: 2px;
		background: linear-gradient(
			90deg,
			rgba(var(--icon-primary-rgb), 0.6),
			rgba(var(--icon-primary-rgb), 0)
		);
		border-radius: 2px;
	}

	h3 {
		font-size: 1rem;
		font-weight: 500;
	}

	p {
		color: var(--text-secondary);
		font-weight: 300;
	}

	/* Content Sections */
	.content-section {
		margin-bottom: 2rem;
		position: relative;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	/* Today's Practice styles */
	.today-practice {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.current-period-card {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.8rem;
		align-items: center;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		border-radius: 16px;
		padding: 1rem;
		box-shadow: 0 4px 15px var(--ui-shadow);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.current-period-card:hover {
		transform: translateY(-2px);
		border-color: rgba(var(--interactive-gradient-1), 0.25);
		box-shadow: 0 8px 20px var(--ui-shadowHover);
	}

	.current-period-card:hover .mindfulness-btn {
		opacity: 0.9;
	}

	.period-icon {
		width: 40px;
		height: 40px;
		background: var(--play-btn-bg);
		color: var(--play-btn-text);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.25);
	}

	.period-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.period-info h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.2rem;
	}

	.period-info p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.mindfulness-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
		color: var(--text-primary);
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.practice-sessions {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
		gap: 1rem;
	}

	.practice-session {
		position: relative;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 12px;
		padding: 1.2rem;
		cursor: pointer;
		transition: all 0.3s ease;
		overflow: hidden;
		box-shadow: 0 4px 15px var(--ui-shadow);
	}

	/* Background pattern styling */
	.practice-session::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 70%;
		background-position: center;
		background-size: cover;
		background-image: var(--bg-pattern);
		opacity: 0.15;
		z-index: 0;
		mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0) 100%);
		-webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0) 100%);
		transition: opacity 0.3s ease;
	}

	.practice-session:hover {
		transform: translateY(-2px);
		border-color: rgba(var(--interactive-gradient-1), 0.2);
		box-shadow: 0 6px 15px var(--ui-shadowHover);
	}

	.practice-session:hover::before {
		opacity: 0.25;
	}

	.practice-session-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.8rem;
		position: relative;
		z-index: 1;
	}

	.practice-time {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.practice-time i {
		color: var(--icon-primary);
	}

	.session-indicators {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.listened-icon {
		color: var(--ui-success);
		font-size: 1rem;
	}

	.content-type-badge {
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		border-radius: 10px;
		background: var(--meditation-badge-bg);
		color: var(--meditation-badge-text);
		font-weight: 500;
		text-transform: capitalize;
		border: 1px solid rgba(255, 255, 255, 0.1);
		display: inline-block;
	}

	.content-type-badge.hypnosis {
		background: var(--hypnosis-badge-bg);
		color: var(--hypnosis-badge-text);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.practice-title {
		font-size: 1.1rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		position: relative;
		z-index: 1;
		padding-right: 2.5rem;
	}

	.practice-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: var(--text-secondary);
		position: relative;
		z-index: 1;
	}

	.meta-divider {
		opacity: 0.6;
	}

	.play-button {
		position: absolute;
		bottom: 1.2rem;
		right: 1.2rem;
		width: 36px;
		height: 36px;
		background: var(--fixed-play-button);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--play-btn-text);
		box-shadow: 0 0 10px rgba(var(--interactive-gradient-1), 0.3);
		transition: all 0.3s ease;
		z-index: 1;
	}

	.practice-session:hover .play-button {
		background: var(--fixed-play-button-hover);
		transform: scale(1.1);
		box-shadow: 0 0 15px rgba(var(--interactive-gradient-1), 0.5);
	}
</style>
