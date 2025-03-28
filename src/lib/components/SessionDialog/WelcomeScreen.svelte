<script lang="ts">
	import { crossfade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

	export let proceedToCheckIn: () => void;

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
</script>

<div class="welcome-screen">
	<div class="welcome-content">
		<h3>Your First Check-in</h3>
		<div class="welcome-text">
			<p>
				Before each session, we'll check in with you to see how you've been getting on and what
				you'd like to focus on today.
			</p>
			<p>
				This helps us personalize your experience and recommend either a meditation or hypnosis
				session that matches your current state of mind and intentions.
			</p>
		</div>
		<button class="proceed-btn" on:click={proceedToCheckIn}>
			<i class="fas fa-arrow-right"></i>
			Start Check-in
		</button>
	</div>
</div>

<style>
	.welcome-screen {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		height: 100%;
		box-sizing: border-box;
	}

	.welcome-content {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.welcome-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		margin: -1rem 0 1.5rem;
	}

	.welcome-content h3 {
		font-family: 'Space Grotesk', sans-serif;

		font-size: 2rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
		letter-spacing: -0.5px;
	}

	p {
		font-family: 'Inter', sans-serif;
		font-size: 1.1rem;
		line-height: 1.6;
		color: var(--text-secondary);
		margin-bottom: 1rem;
		max-width: 600px;
	}

	.proceed-btn {
		margin-top: auto;
		padding: 0.9rem 1.5rem;
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		font-weight: 500;
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
		position: relative;
		overflow: hidden;
	}

	.proceed-btn::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 50%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transform: skewX(-25deg);
		transition: all 0.75s ease;
	}

	.proceed-btn:hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(var(--interactive-gradient-1), 0.25);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
	}

	.proceed-btn:hover::after {
		left: 100%;
	}

	.proceed-btn:active {
		transform: translateY(-1px);
		box-shadow: 0 4px 10px rgba(var(--interactive-gradient-1), 0.15);
	}

	.proceed-btn i {
		font-size: 1rem;
		transition: transform 0.3s ease;
	}

	.proceed-btn:hover i {
		transform: translateX(3px);
	}
</style>
