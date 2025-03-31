<script lang="ts">
	import { onMount } from 'svelte';
	import {
		profileSetupStore,
		updateProfileSetupStore,
		resetProfileSetupStore
	} from '$lib/stores/profileSetup';
	import { goto } from '$app/navigation';
	import type { ProfileSetup } from '$lib/stores/profileSetup';
	import { transition } from '$lib/stores/transition';
	import { updateUserProfile } from '$lib/api';
	import { showSuccess, showError } from '$lib/stores/notifications';
	import type { PageData } from './$types';

	export let data: PageData;

	let currentQuestion = 0;
	let progressPercentage = 0;
	let isTransitioning = false;

	type Question = {
		question: string;
		description: string;
		options: Array<{ display: string; value: string }>;
		key: keyof ProfileSetup;
		multiple: boolean;
	};

	const questions: Question[] = [
		{
			question: "What's your main goal for meditating?",
			description: "We'll personalize your experience based on your goals",
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
			description: 'Understanding your stress helps us recommend appropriate sessions',
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
			description: "We'll tailor sleep-focused meditations to your needs",
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
			description: 'This helps us recommend the right meditation length for you',
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
			description: "We'll suggest meditations that complement your mental state",
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
			description: 'This helps us understand your digital wellness needs',
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

	// Define the expected keys consistently
	const expectedPreferenceKeys: (keyof ProfileSetup)[] = [
		'meditationGoal',
		'stressLevel',
		'sleepPattern',
		'focusDuration',
		'mentalState',
		'techUsage'
	];

	onMount(() => {
		resetProfileSetupStore();
		updateProgressBar();

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
			updateProgressBar();
			transition.setVisible(true);
			transition.fadeIn();
		}
	}

	function updateProgressBar() {
		progressPercentage = (currentQuestion / questions.length) * 100;
	}

	function updateStore(key: keyof ProfileSetup, value: string) {
		updateProfileSetupStore(key, value);
	}

	function nextQuestion() {
		if (isTransitioning) return;

		if (currentQuestion < questions.length - 1) {
			isTransitioning = true;
			transition.fadeOut();
			setTimeout(() => {
				currentQuestion++;
				updateProgressBar();
				history.pushState({ question: currentQuestion }, '');
				transition.setVisible(true);
				transition.fadeIn();
				setTimeout(() => {
					isTransitioning = false;
				}, 500);
			}, 500);
		} else {
			submitForm();
		}
	}

	function prevQuestion() {
		if (isTransitioning) return;

		if (currentQuestion > 0) {
			isTransitioning = true;
			transition.fadeOut();
			setTimeout(() => {
				history.back();
				setTimeout(() => {
					isTransitioning = false;
				}, 500);
			}, 500);
		}
	}

	async function submitForm() {
		if (isTransitioning) return;

		try {
			if (!data.session?.user?.id) {
				showError('User session not found. Please log in again.');
				return;
			}

			// Validate that we have all required preferences
			const missingPreferences = expectedPreferenceKeys.filter((key) => !$profileSetupStore[key]);
			if (missingPreferences.length > 0) {
				showError('Please complete all questions before submitting.');
				return;
			}

			// Use the store data directly
			await updateUserProfile(data.session.user.id, {
				preferences: $profileSetupStore,
				complete: true
			});

			showSuccess('Profile setup complete!');
			goto('/dashboard');
		} catch (err) {
			// It's still good practice to log the actual error for developers
			console.error('Error updating profile:', err);
			showError(`Failed to save profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
		}
	}

	function handleOptionClick(key: keyof ProfileSetup, value: string) {
		if (isTransitioning) return;

		if ($profileSetupStore[key] === value) {
			// Important: This handles the case where a user selects the same option again
			// It allows progression to the next question even if the value hasn't changed
			if (!questions[currentQuestion].multiple) {
				if (currentQuestion === questions.length - 1) {
					setTimeout(() => submitForm(), 800);
				} else {
					nextQuestion();
				}
			}
		}
	}

	function handleOptionChange(key: keyof ProfileSetup, value: string) {
		if (isTransitioning) return;

		updateStore(key, value);
		// Important: This progresses to the next question automatically
		// when a new option is selected for non-multiple choice questions
		if (!questions[currentQuestion].multiple) {
			if (currentQuestion === questions.length - 1) {
				setTimeout(() => submitForm(), 800);
			} else {
				setTimeout(() => nextQuestion(), 500);
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
		<h1>Welcome to InTheMoment</h1>
		<p>Let's personalize your meditation experience</p>
	</div>

	<div class="progress-container">
		<div class="progress-bar">
			<div class="progress-fill" style="width: {progressPercentage}%"></div>
		</div>
		<div class="progress-text">Question {currentQuestion + 1} of {questions.length}</div>
	</div>

	<form method="POST">
		{#each questions as q}
			<input type="hidden" name={q.key} value={$profileSetupStore[q.key] || ''} />
		{/each}

		<div class="form-content">
			{#if $transition.visible}
				<div
					class="question-container"
					style="opacity: {$transition.opacity}; transform: translateY({20 -
						$transition.opacity * 20}px); transition: opacity 0.5s ease, transform 0.5s ease;"
				>
					<div class="question-header">
						<h2>{questions[currentQuestion].question}</h2>
						<p class="question-description">{questions[currentQuestion].description}</p>
					</div>

					<div class="options-container">
						{#each questions[currentQuestion].options as option, i}
							<label
								class="option-label"
								style="animation-delay: {i * 0.08}s"
								class:selected={$profileSetupStore[questions[currentQuestion].key] === option.value}
							>
								<input
									type={questions[currentQuestion].multiple ? 'checkbox' : 'radio'}
									name={questions[currentQuestion].key}
									value={option.value}
									checked={$profileSetupStore[questions[currentQuestion].key] === option.value}
									on:click={() => handleOptionClick(questions[currentQuestion].key, option.value)}
									on:change={() => handleOptionChange(questions[currentQuestion].key, option.value)}
								/>
								<div class="option-content">
									<span class="option-text">{option.display}</span>
									{#if $profileSetupStore[questions[currentQuestion].key] === option.value}
										<i class="fas fa-check"></i>
									{/if}
								</div>
							</label>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		{#if $transition.visible}
			<div
				class="navigation"
				style="opacity: {$transition.opacity}; transition: opacity 0.5s ease;"
			>
				<div class="nav-left">
					{#if currentQuestion > 0}
						<button
							type="button"
							class="back-button"
							on:click={prevQuestion}
							disabled={isTransitioning}
						>
							<i class="fas fa-arrow-left"></i> Back
						</button>
					{/if}
				</div>

				<div class="nav-right">
					{#if questions[currentQuestion].multiple}
						<button
							type="button"
							class="next-button"
							on:click={nextQuestion}
							disabled={isTransitioning}
						>
							{currentQuestion === questions.length - 1 ? 'Complete' : 'Continue'}
							<i class="fas fa-arrow-right"></i>
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</form>
</div>

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
		max-width: 500px;
		margin: 0 auto;
	}

	.profile-setup-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	h1 {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
		letter-spacing: -0.5px;
		text-shadow: 0 0 20px rgba(var(--icon-primary-rgb), 0.1);
	}

	.profile-setup-header p {
		color: var(--text-secondary);
		font-size: 1.1rem;
		margin: 0;
	}

	.progress-container {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 2.5rem;
	}

	.progress-bar {
		width: 100%;
		height: 3px;
		background-color: rgba(var(--interactive-gradient-1), 0.1);
		border-radius: 1.5px;
		overflow: hidden;
		margin-bottom: 0.75rem;
	}

	.progress-fill {
		height: 100%;
		background: var(--slider-progress-bg);
		border-radius: 1.5px;
		transition: width 0.8s ease;
	}

	.progress-text {
		font-size: 0.85rem;
		color: var(--text-secondary);
		opacity: 0.8;
		font-family: 'Inter', sans-serif;
	}

	form {
		width: 100%;
		position: relative;
	}

	.form-content {
		position: relative;
		width: 100%;
		min-height: 400px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.question-container {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.question-header {
		text-align: center;
		margin-bottom: 1.75rem;
	}

	h2 {
		font-family: 'Space Grotesk', sans-serif;
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1.6rem;
		margin-bottom: 0.75rem;
		position: relative;
		display: inline-block;
	}

	h2::after {
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

	.question-description {
		color: var(--text-secondary);
		font-size: 1rem;
		margin: 0;
		max-width: 600px;
		margin: 0 auto;
		line-height: 1.5;
		font-family: 'Inter', sans-serif;
	}

	.options-container {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		width: 100%;
	}

	.option-label {
		animation: fadeInUp 0.6s ease forwards;
		opacity: 0;
		transform: translateY(10px);
		cursor: pointer;
		position: relative;
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

	.option-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.1rem 1.25rem;
		border-radius: 12px;
		background: linear-gradient(
			135deg,
			rgba(var(--background-card-rgb), 0.9) 0%,
			rgba(var(--background-card-rgb), 0.7) 100%
		);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
		transition: all 0.3s ease;
		box-shadow: 0 2px 8px var(--ui-shadow);
	}

	.option-text {
		color: var(--text-primary);
		font-size: 1rem;
		font-weight: 500;
		font-family: 'Inter', sans-serif;
	}

	.option-label.selected .option-content {
		background: var(--btn-bg);
		border-color: rgba(var(--interactive-gradient-1), 0.3);
		box-shadow: 0 4px 15px rgba(var(--interactive-gradient-1), 0.2);
		transform: translateY(-2px);
	}

	.option-label.selected .option-text {
		color: var(--btn-text);
	}

	.option-label i {
		color: var(--btn-text);
		font-size: 0.9rem;
	}

	/* Hover effect only for non-touch devices */
	@media (hover: hover) {
		.option-content:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px var(--ui-shadowHover);
			border-color: rgba(var(--interactive-gradient-1), 0.2);
		}
	}

	.navigation {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 2rem;
		width: 100%;
	}

	.nav-left,
	.nav-right {
		display: flex;
		align-items: center;
	}

	.back-button,
	.next-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.8rem 1.25rem;
		border-radius: 12px;
		font-size: 0.9rem;
		font-weight: 500;
		font-family: 'Inter', sans-serif;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.back-button {
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.1);
	}

	.back-button:hover:not([disabled]) {
		color: var(--text-primary);
		background-color: rgba(var(--background-card-rgb), 0.5);
	}

	.next-button {
		background: var(--btn-bg);
		color: var(--btn-text);
		border: 1px solid rgba(var(--interactive-gradient-1), 0.2);
	}

	.next-button:hover:not([disabled]) {
		background: var(--btn-bg-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--ui-shadowHover);
	}

	button[disabled] {
		opacity: 0.7;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.profile-setup {
			padding: 1.5rem 1rem;
		}

		h2 {
			font-size: 1.5rem;
		}

		.option-content {
			padding: 1rem 1.25rem;
		}

		.option-text {
			font-size: 0.95rem;
		}

		.form-content {
			min-height: 350px;
		}
	}

	@media (max-width: 480px) {
		.profile-setup {
			padding: 1rem 0.75rem;
		}

		.profile-setup-header {
			margin-bottom: 2rem;
		}

		h1 {
			font-size: 1.75rem;
		}

		.profile-setup-header p {
			font-size: 0.95rem;
		}

		h2 {
			font-size: 1.3rem;
		}

		.question-description {
			font-size: 0.9rem;
		}

		.option-content {
			padding: 0.9rem 1rem;
		}

		.option-text {
			font-size: 0.95rem;
		}

		.back-button,
		.next-button {
			padding: 0.75rem 1.25rem;
			font-size: 0.9rem;
		}

		.form-content {
			min-height: 300px;
		}
	}
</style>
