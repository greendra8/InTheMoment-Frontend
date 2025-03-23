<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Animation for glow effects
	let pulseValue = 0;

	// Pricing toggle state
	let isAnnual = true;

	onMount(() => {
		const pulseInterval = setInterval(() => {
			pulseValue = 0.5 + Math.sin(Date.now() / 1000) * 0.5;
		}, 50);

		return () => clearInterval(pulseInterval);
	});

	function handleSubscribe() {
		// TODO: Implement subscription flow
		// For now, just redirect to dashboard
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Pro Subscription - InTheMoment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="pro-container">
	<!-- Hero Section -->
	<div class="pro-hero">
		<h1>Upgrade to Pro</h1>
		<p class="hero-subtitle">Unlock premium features for your mindfulness journey</p>
	</div>

	<!-- Pricing Toggle -->
	<div class="pricing-toggle">
		<span class:active={!isAnnual}>Monthly</span>
		<label class="toggle-switch">
			<input type="checkbox" bind:checked={isAnnual} />
			<span class="toggle-slider"></span>
		</label>
		<div class="annual-label">
			<span class:active={isAnnual}>Annual</span>
			<span class="save-badge">Save 17%</span>
		</div>
	</div>

	<!-- Pricing Card -->
	<div class="pricing-card">
		<div class="price-header">
			<div class="price-amount">
				<span class="currency">$</span>
				<span class="amount">{isAnnual ? '40' : '4'}</span>
				<span class="period">/ {isAnnual ? 'year' : 'month'}</span>
			</div>
		</div>

		<button class="subscribe-btn" on:click={handleSubscribe}>
			<i class="fas fa-bolt"></i>
			<span>Upgrade Now</span>
		</button>

		<!-- Features List -->
		<div class="features-list">
			<div class="feature-item">
				<i class="fas fa-check-circle"></i>
				<span>Premium high-quality voices</span>
			</div>
			<div class="feature-item">
				<i class="fas fa-check-circle"></i>
				<span>Extended sessions up to 60 minutes</span>
			</div>
			<div class="feature-item">
				<i class="fas fa-check-circle"></i>
				<span>10 generations per day (vs. 3 on free)</span>
			</div>
			<div class="feature-item">
				<i class="fas fa-check-circle"></i>
				<span>Priority generation queue</span>
			</div>
			<div class="feature-item">
				<i class="fas fa-check-circle"></i>
				<span>Ad-free experience</span>
			</div>
		</div>
	</div>

	<!-- FAQ Section -->
	<div class="faq-section">
		<h2>Common Questions</h2>
		<div class="faq-item">
			<div class="faq-header">
				<span>Can I cancel anytime?</span>
			</div>
			<p class="faq-answer">
				Yes, you can cancel your subscription at any time with no questions asked.
			</p>
		</div>
		<div class="faq-item">
			<div class="faq-header">
				<span>How do the premium voices differ?</span>
			</div>
			<p class="faq-answer">
				Pro voices feature enhanced clarity, natural intonation, and a wider range of voice options.
			</p>
		</div>
	</div>

	<!-- Money-back Guarantee -->
	<div class="guarantee">
		<i class="fas fa-shield-alt"></i>
		<p>30-day money-back guarantee. No risk, try it today.</p>
	</div>
</div>

<style>
	/* Main Container */
	.pro-container {
		width: 100%;
		padding: 1.5rem 0;
		position: relative;
		overflow: visible;
	}

	/* Subtle ambient glow */
	.pro-container::after {
		content: '';
		position: absolute;
		top: 10%;
		right: 10%;
		width: 40%;
		height: 40%;
		background: radial-gradient(
			ellipse at center,
			rgba(var(--interactive-gradient-1), 0.04) 0%,
			rgba(var(--interactive-gradient-1), 0) 70%
		);
		border-radius: 50%;
		z-index: -1;
		pointer-events: none;
		filter: blur(60px);
	}

	/* Hero Section */
	.pro-hero {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	h1 {
		font-family: 'Poppins', sans-serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.5rem;
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.1);
	}

	.hero-subtitle {
		font-size: 1rem;
		color: var(--text-secondary);
		margin: 0;
		font-weight: 300;
		max-width: 90%;
		margin: 0 auto;
	}

	/* Pricing Toggle */
	.pricing-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin: 1.5rem 0;
		font-family: 'Poppins', sans-serif;
	}

	.pricing-toggle span {
		font-size: 0.9rem;
		color: var(--text-secondary);
		transition: all 0.3s ease;
	}

	.pricing-toggle span.active {
		color: var(--text-primary);
		font-weight: 500;
	}

	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 48px;
		height: 24px;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(var(--interactive-gradient-1), 0.3);
		border-radius: 34px;
		transition: 0.4s;
	}

	.toggle-slider:before {
		position: absolute;
		content: '';
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background-color: var(--background-card);
		border-radius: 50%;
		transition: 0.4s;
	}

	input:checked + .toggle-slider:before {
		transform: translateX(24px);
	}

	.annual-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.save-badge {
		font-size: 0.7rem !important;
		background: rgba(var(--interactive-gradient-1), 0.15);
		color: var(--text-primary) !important;
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-weight: 500 !important;
	}

	/* Pricing Card */
	.pricing-card {
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border-radius: 16px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.15);
		box-shadow: 0 8px 20px var(--ui-shadow);
		backdrop-filter: blur(5px);
		position: relative;
		overflow: hidden;
	}

	.price-header {
		text-align: center;
		margin-bottom: 1.25rem;
	}

	.price-amount {
		display: flex;
		align-items: baseline;
		justify-content: center;
		color: var(--text-primary);
		font-family: 'Poppins', sans-serif;
	}

	.currency {
		font-size: 1.5rem;
		font-weight: 500;
		margin-right: 0.1rem;
	}

	.amount {
		font-size: 3.5rem;
		font-weight: 700;
		line-height: 1;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 1) 0%,
			rgba(var(--interactive-gradient-2), 1) 100%
		);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-fill-color: transparent;
	}

	.period {
		font-size: 1rem;
		color: var(--text-secondary);
		margin-left: 0.25rem;
	}

	.subscribe-btn {
		width: 100%;
		padding: 1rem;
		margin: 0.5rem 0 1.5rem;
		font-size: 1.1rem;
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		box-shadow: 0 4px 12px rgba(var(--interactive-gradient-1), 0.15);
		position: relative;
		overflow: hidden;
	}

	.subscribe-btn::after {
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

	.subscribe-btn:hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(var(--interactive-gradient-1), 0.25);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
	}

	.subscribe-btn:hover::after {
		left: 100%;
	}

	.subscribe-btn:active {
		transform: translateY(-1px);
		box-shadow: 0 4px 10px rgba(var(--interactive-gradient-1), 0.15);
	}

	.subscribe-btn i {
		font-size: 1.1rem;
	}

	/* Features List */
	.features-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.feature-item i {
		color: var(--ui-success);
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	.feature-item span {
		font-size: 1rem;
		color: var(--text-primary);
		font-family: 'Poppins', sans-serif;
	}

	/* FAQ Section */
	.faq-section {
		margin: 1.5rem 0;
	}

	h2 {
		font-family: 'Poppins', sans-serif;
		font-size: 1.3rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1rem;
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

	.faq-item {
		background: rgba(var(--background-card-rgb), 0.7);
		border-radius: 10px;
		margin-bottom: 0.75rem;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		overflow: hidden;
		padding: 1rem;
	}

	.faq-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.faq-header span {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		font-family: 'Poppins', sans-serif;
	}

	.faq-answer {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.5;
		font-family: 'Poppins', sans-serif;
	}

	/* Guarantee */
	.guarantee {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(var(--interactive-gradient-1), 0.05);
		border-radius: 8px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		margin-bottom: 1rem;
	}

	.guarantee i {
		font-size: 1.2rem;
		color: var(--ui-success);
	}

	.guarantee p {
		font-size: 0.9rem;
		color: var(--text-primary);
		margin: 0;
		font-family: 'Poppins', sans-serif;
		font-weight: 500;
	}

	/* Responsive Adjustments */
	@media (max-width: 480px) {
		.pro-hero {
			margin-bottom: 1.25rem;
		}

		h1 {
			font-size: 1.75rem;
		}

		.hero-subtitle {
			font-size: 0.9rem;
		}

		.pricing-card {
			padding: 1.25rem;
		}

		.amount {
			font-size: 3rem;
		}

		.subscribe-btn {
			padding: 0.9rem;
			font-size: 1rem;
		}

		.feature-item {
			gap: 0.6rem;
		}

		.feature-item span {
			font-size: 0.95rem;
		}

		.faq-header span {
			font-size: 0.95rem;
		}

		.faq-answer {
			font-size: 0.85rem;
		}
	}
</style>
