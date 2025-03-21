<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import Hero from './components/Hero.svelte';
	import ContinueListening from './components/ContinueListening.svelte';
	import TodaysPractice from './components/TodaysPractice.svelte';
	import NewUserOnboarding from './components/NewUserOnboarding.svelte';
	import PlaylistsSection from './components/PlaylistsSection.svelte';
	import RecentSessions from './components/RecentSessions.svelte';
	import StatsSection from './components/StatsSection.svelte';

	export let data: PageData;

	$: ({
		meditations,
		totalMeditations,
		playlists,
		recentPlaylists,
		user,
		inProgressMeditation,
		currentTimeOfDay,
		hasMorningSession,
		hasMiddaySession,
		hasEveningSession,
		morningSession,
		middaySession,
		eveningSession
	} = data);

	// For Continue Listening section
	$: displayedMeditation = inProgressMeditation || (meditations.length > 0 ? meditations[0] : null);

	// Calculate stats
	$: daysInRow = calculateDaysInRow(meditations);
	$: totalMinutes = user.minutesListened || 0;

	function calculateDaysInRow(meditations: any[]) {
		if (!meditations || meditations.length === 0) return 0;
		let streak = 1;
		const sortedDates = meditations
			.map((m) => new Date(m.created_at))
			.sort((a, b) => b.getTime() - a.getTime());
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (sortedDates[0].toDateString() !== today.toDateString()) return 0;

		for (let i = 1; i < sortedDates.length; i++) {
			const prevDate = new Date(sortedDates[i - 1]);
			prevDate.setDate(prevDate.getDate() - 1);
			if (sortedDates[i].toDateString() === prevDate.toDateString()) {
				streak++;
			} else {
				break;
			}
		}
		return streak;
	}

	function handleNavigation(path: string) {
		goto(path);
	}

	// Animation for glow effects
	let pulseValue = 0;

	onMount(() => {
		const pulseInterval = setInterval(() => {
			pulseValue = 0.5 + Math.sin(Date.now() / 1000) * 0.5;
		}, 50);

		return () => clearInterval(pulseInterval);
	});
</script>

<svelte:head>
	<title>Dashboard - In The Moment</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="neo-dashboard">
	<Hero {user} {handleNavigation} />

	{#if meditations.length > 0}
		<StatsSection {totalMinutes} {daysInRow} {totalMeditations} enabled={false} />

		<ContinueListening
			{displayedMeditation}
			{inProgressMeditation}
			{recentPlaylists}
			{handleNavigation}
		/>
	{/if}

	{#if meditations.length > 0}
		<TodaysPractice
			{currentTimeOfDay}
			{hasMorningSession}
			{hasMiddaySession}
			{hasEveningSession}
			{morningSession}
			{middaySession}
			{eveningSession}
			{handleNavigation}
		/>
	{/if}

	{#if meditations.length === 0}
		<NewUserOnboarding {handleNavigation} {pulseValue} />
	{/if}

	<PlaylistsSection {playlists} {handleNavigation} />

	<RecentSessions {meditations} {handleNavigation} />
</div>

<style>
	/* Base Styles */
	.neo-dashboard {
		position: relative;
		overflow: visible;
	}
</style>
