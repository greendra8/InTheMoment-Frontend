<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import {
		profileSetupStore,
		updateProfileSetupStore,
		resetProfileSetupStore
	} from '$lib/stores/profileSetup';
	import { goto } from '$app/navigation';
	import type { ProfileSetup } from '$lib/stores/profileSetup';
	import { transition } from '$lib/stores/transition';

	let currentQuestion = 0;
	let errorMessage = '';

	type Question = {
		question: string;
		options: Array<{ display: string; value: string }>;
		key: keyof ProfileSetup;
		multiple: boolean;
	};

	const questions: Question[] = [
		{
			question: "What's your main goal for meditating?",
			options: [
				{
					display: 'Reduce stress',
					value: 'User seeks to alleviate stress and tension in their life.'
				},
				{
					display: 'Improve sleep',
					value: 'User aims to enhance their sleep quality and patterns.'
				},
				{
					display: 'Increase focus',
					value: 'User wants to improve their concentration and attention span.'
				},
				{
					display: 'Emotional balance',
					value: 'User desires better control and understanding of their emotions.'
				},
				{
					display: 'Personal growth',
					value: 'User is interested in self-improvement and inner development.'
				},
				{
					display: "I'm not sure yet",
					value: 'User is new to meditation and exploring its benefits.'
				}
			],
			key: 'meditationGoal',
			multiple: false
		},
		{
			question: 'How would you describe your current stress level?',
			options: [
				{
					display: 'Generally relaxed',
					value: 'User experiences low levels of stress in their daily life.'
				},
				{
					display: 'Occasionally stressed',
					value: 'User faces moderate stress levels from time to time.'
				},
				{
					display: 'Frequently overwhelmed',
					value: 'User often experiences high levels of stress and feels overwhelmed.'
				},
				{
					display: "I'm not sure",
					value: 'User is uncertain about their stress levels or how to categorise them.'
				}
			],
			key: 'stressLevel',
			multiple: false
		},
		{
			question: 'Which best describes your sleep?',
			options: [
				{
					display: 'Fall asleep easily, wake up refreshed',
					value: 'User has a healthy sleep pattern with no significant issues.'
				},
				{
					display: 'Trouble falling asleep',
					value: 'User struggles with initiating sleep at bedtime.'
				},
				{
					display: 'Wake up frequently during the night',
					value: 'User experiences interrupted sleep and difficulty staying asleep.'
				},
				{
					display: 'Wake up feeling unrefreshed',
					value: "User's sleep quality is poor, leading to fatigue upon waking."
				},
				{
					display: "I'm not sure",
					value: 'User is uncertain about their sleep patterns or quality.'
				}
			],
			key: 'sleepPattern',
			multiple: false
		},
		{
			question: 'How long can you typically focus on one task without getting distracted?',
			options: [
				{
					display: 'Less than 5 minutes',
					value: 'User has a very short attention span and gets distracted easily.'
				},
				{
					display: '5-15 minutes',
					value: 'User can maintain focus for short periods but struggles with longer durations.'
				},
				{
					display: '15-30 minutes',
					value: 'User has a moderate attention span suitable for many tasks.'
				},
				{
					display: 'More than 30 minutes',
					value: 'User can sustain focus for extended periods without significant distraction.'
				},
				{
					display: "I haven't really noticed",
					value: 'User is unaware of their typical focus duration.'
				}
			],
			key: 'focusDuration',
			multiple: false
		},
		{
			question: 'How would you describe your typical mental state throughout the day?',
			options: [
				{
					display: 'Calm and centred',
					value: 'User generally maintains a balanced and peaceful state of mind.'
				},
				{
					display: 'Anxious or worried',
					value: 'User often experiences anxiety or excessive worry in their daily life.'
				},
				{
					display: 'Distracted or scattered',
					value: 'User frequently feels unfocused and has difficulty concentrating.'
				},
				{
					display: 'Tired or low energy',
					value: 'User commonly experiences fatigue or lack of energy throughout the day.'
				},
				{
					display: 'It varies greatly day to day',
					value: "User's mental state is highly variable and inconsistent."
				}
			],
			key: 'mentalState',
			multiple: false
		},
		{
			question: 'How would you characterise your daily technology use?',
			options: [
				{
					display: 'Minimal - I use tech only when necessary',
					value: 'User has limited engagement with technology in their daily life.'
				},
				{
					display: 'Moderate - I balance tech use with offline activities',
					value: 'User maintains a healthy balance between technology use and other activities.'
				},
				{
					display: "Heavy - I'm connected most of the day",
					value: 'User spends a significant portion of their day engaged with technology.'
				},
				{
					display: 'Constant - I feel anxious when not connected',
					value: 'User has a strong dependency on technology and feels uneasy without it.'
				},
				{
					display: "I'm not sure how to categorise my usage",
					value: 'User is uncertain about their technology usage patterns.'
				}
			],
			key: 'techUsage',
			multiple: false
		}
	];

	onMount(() => {
		resetProfileSetupStore();

		// Push initial state
		history.pushState({ question: currentQuestion }, '');

		// Listen for popstate events
		window.addEventListener('popstate', handlePopState);

		return () => {
			// Clean up the event listener when the component is destroyed
			window.removeEventListener('popstate', handlePopState);
		};
	});

	function handlePopState(event: PopStateEvent) {
		if (event.state && typeof event.state.question === 'number') {
			currentQuestion = event.state.question;
			transition.setVisible(true);
			transition.fadeIn();
		}
	}

	function updateStore(key: keyof ProfileSetup, value: string) {
		updateProfileSetupStore(key, value);
	}

	function nextQuestion() {
		if (currentQuestion < questions.length - 1) {
			setTimeout(() => {
				currentQuestion++;
				history.pushState({ question: currentQuestion }, '');
				transition.setVisible(true);
				transition.fadeIn();
			}, 700); // 500ms pause before fade-in starts
		} else {
			submitForm();
		}
	}

	function prevQuestion() {
		if (currentQuestion > 0) {
			history.back();
		}
	}

	async function submitForm() {
		const formElement = document.querySelector('form');
		if (!formElement) {
			errorMessage = 'Form not found';
			return;
		}
		const response = await fetch('?/submit', {
			method: 'POST',
			body: new FormData(formElement as HTMLFormElement)
		});
		const result = await response.json();
		if (result.type === 'success') {
			goto('/new');
		} else {
			errorMessage = 'An error occurred while saving your profile. Please try again.';
		}
	}

	function handleOptionClick(key: keyof ProfileSetup, value: string) {
		if ($profileSetupStore[key] === value) {
			// Important: This handles the case where a user selects the same option again
			// It allows progression to the next question even if the value hasn't changed
			if (!questions[currentQuestion].multiple) {
				if (currentQuestion === questions.length - 1) {
					setTimeout(() => submitForm(), 600);
				} else {
					nextQuestion();
				}
			}
		}
	}

	function handleOptionChange(key: keyof ProfileSetup, value: string) {
		updateStore(key, value);
		// Important: This progresses to the next question automatically
		// when a new option is selected for non-multiple choice questions
		if (!questions[currentQuestion].multiple) {
			if (currentQuestion === questions.length - 1) {
				setTimeout(() => submitForm(), 600);
			} else {
				nextQuestion();
			}
		}
	}
</script>

<svelte:head>
	<title>Profile Setup</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="profile-setup">
	<div class="profile-setup-header">
		<h1>Profile Setup</h1>
		<p>Help us personalize your meditation experience</p>
	</div>

	<div class="profile-setup-card">
		<form method="POST" use:enhance>
			{#each questions as q}
				<!-- Important: These hidden inputs ensure all question responses are submitted,
             even if the user navigates back and forth between questions -->
				<input type="hidden" name={q.key} value={$profileSetupStore[q.key] || ''} />
			{/each}
			<div class="form-content">
				<div class="form-container">
					{#if $transition.visible}
						<div
							class="question"
							style="opacity: {$transition.opacity}; transition: opacity 0.15s ease;"
						>
							<h3>{questions[currentQuestion].question}</h3>
							<div class="options-grid">
								{#each questions[currentQuestion].options as option, i}
									<label class="option-label" style="animation-delay: {i * 0.05}s">
										<input
											type={questions[currentQuestion].multiple ? 'checkbox' : 'radio'}
											name={questions[currentQuestion].key}
											value={option.value}
											checked={$profileSetupStore[questions[currentQuestion].key] === option.value}
											on:click={() =>
												handleOptionClick(questions[currentQuestion].key, option.value)}
											on:change={() =>
												handleOptionChange(questions[currentQuestion].key, option.value)}
										/>
										<span class="option-text">{option.display}</span>
									</label>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>

			{#if $transition.visible}
				<div
					class="navigation"
					style="opacity: {$transition.opacity}; transition: opacity 0.15s ease;"
				>
					<div class="nav-left">
						{#if currentQuestion > 0}
							<button type="button" class="back-link" on:click={prevQuestion}>
								<i class="fas fa-arrow-left"></i> Back
							</button>
						{/if}
					</div>
					<div class="progress-indicator">
						{#each Array(questions.length) as _, i}
							<div class="progress-dot" class:active={i <= currentQuestion}></div>
						{/each}
					</div>
					<div class="nav-right">
						<div class="question-counter">{currentQuestion + 1}/{questions.length}</div>
						{#if questions[currentQuestion].multiple}
							<button type="button" class="btn primary" on:click={nextQuestion}>
								{currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</form>
	</div>
</div>

{#if errorMessage}
	<div class="error-message">
		<i class="fas fa-exclamation-circle"></i>
		{errorMessage}
	</div>
{/if}

<style>
	.profile-setup {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding: 2rem 1rem;
		box-sizing: border-box;
		position: relative;
		min-height: 100vh;
	}

	.profile-setup-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.1);
	}

	.profile-setup-header p {
		color: var(--text-secondary);
		font-size: 1rem;
		margin: 0;
	}

	.profile-setup-card {
		width: 100%;
		max-width: 700px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 15px var(--ui-shadow);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		backdrop-filter: blur(5px);
		position: relative;
		overflow: hidden;
	}

	/* Add subtle gradient background effect */
	.profile-setup-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.05),
			rgba(var(--interactive-gradient-2), 0.02)
		);
		opacity: 1;
		z-index: 0;
	}

	.form-content {
		position: relative;
		width: 100%;
		z-index: 1;
	}

	.form-container {
		width: 100%;
		min-height: 300px;
	}

	.question {
		text-align: center;
		margin-bottom: 2.5rem;
		transition: opacity 0.3s ease;
	}

	h3 {
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 2rem;
		font-size: 1.5rem;
		position: relative;
		display: inline-block;
	}

	h3::after {
		content: '';
		position: absolute;
		bottom: -8px;
		left: 50%;
		transform: translateX(-50%);
		width: 40px;
		height: 2px;
		background: linear-gradient(
			90deg,
			rgba(var(--interactive-gradient-1), 0.6),
			rgba(var(--interactive-gradient-2), 0.6)
		);
		border-radius: 2px;
	}

	.options-grid {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	}

	.option-label {
		animation: fadeInUp 0.5s ease forwards;
		opacity: 0;
		transform: translateY(10px);
	}

	@keyframes fadeInUp {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	input[type='radio'],
	input[type='checkbox'] {
		position: absolute;
		opacity: 0;
		cursor: pointer;
		height: 0;
		width: 0;
	}

	.option-text {
		color: var(--text-primary);
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		text-align: center;
		transition: all 0.3s ease;
		position: relative;
		z-index: 1;
		padding: 1rem 0;
		cursor: pointer;
		border-radius: 12px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		box-shadow: 0 2px 8px var(--ui-shadow);
	}

	/* Hover effect only for non-touch devices */
	@media (hover: hover) {
		.option-text:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px var(--ui-shadowHover);
			border-color: rgba(var(--interactive-gradient-1), 0.2);
		}
	}

	.option-label input:checked + .option-text {
		color: var(--btn-text);
		background: var(--btn-bg);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 15px rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
	}

	.navigation {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 2rem;
		width: 100%;
		transition: opacity 0.3s ease;
		position: relative;
		z-index: 1;
	}

	.nav-left,
	.nav-right {
		display: flex;
		align-items: center;
	}

	.nav-right {
		justify-content: flex-end;
		gap: 1rem;
	}

	.question-counter {
		font-size: 0.9rem;
		color: var(--text-secondary);
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.1) 0%,
			rgba(var(--interactive-gradient-2), 0.05) 100%
		);
		padding: 0.4rem 0.75rem;
		border-radius: 8px;
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		backdrop-filter: blur(5px);
	}

	.progress-indicator {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.progress-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: rgba(var(--interactive-gradient-1), 0.2);
		transition: all 0.3s ease;
	}

	.progress-dot.active {
		background: linear-gradient(
			135deg,
			rgba(var(--interactive-gradient-1), 0.6) 0%,
			rgba(var(--interactive-gradient-2), 0.7) 100%
		);
		transform: scale(1.2);
	}

	.back-link {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0.5rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s ease;
	}

	.back-link:hover {
		color: var(--text-primary);
		transform: translateX(-3px);
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: 500;
		font-family: 'Inter', sans-serif;
	}

	.btn:active {
		transform: translateY(1px);
	}

	.btn.primary {
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
	}

	.btn.primary:hover {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--ui-shadowHover);
	}

	.error-message {
		color: var(--text-error);
		background: var(--background-error);
		text-align: center;
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 12px;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
		max-width: 700px;
		width: 100%;
	}

	@media (max-width: 768px) {
		.profile-setup {
			padding: 1.5rem 1rem;
		}

		.profile-setup-card {
			padding: 1.5rem;
		}

		.options-grid {
			grid-template-columns: 1fr;
		}

		h3 {
			font-size: 1.3rem;
			margin-bottom: 1.5rem;
		}

		.form-container {
			min-height: 250px;
		}

		.navigation {
			flex-wrap: wrap;
			gap: 1rem;
		}

		.progress-indicator {
			order: 3;
			width: 100%;
			justify-content: center;
			margin-top: 1rem;
		}
	}

	@media (max-width: 480px) {
		.profile-setup {
			padding: 1rem 0.5rem;
		}

		.profile-setup-card {
			padding: 1.25rem;
			border-radius: 12px;
		}

		h1 {
			font-size: 1.5rem;
		}

		.profile-setup-header p {
			font-size: 0.9rem;
		}

		h3 {
			font-size: 1.1rem;
			margin-bottom: 1.25rem;
		}

		.option-text {
			font-size: 0.9rem;
			padding: 0.8rem 0;
		}

		.btn {
			padding: 0.6rem 1.2rem;
			font-size: 0.9rem;
		}

		.question-counter {
			font-size: 0.8rem;
			padding: 0.3rem 0.6rem;
		}

		.back-link {
			font-size: 0.8rem;
		}
	}
</style>
