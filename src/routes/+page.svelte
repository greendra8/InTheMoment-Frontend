<script lang="ts">
	import Hero from './components/Hero.svelte';
	import Intro from './components/Intro.svelte';
	import Features from './components/Features.svelte';
	import HowItWorks from './components/HowItWorks.svelte';
	import Benefits from './components/Benefits.svelte';
	import MobileSection from './components/MobileSection.svelte';
	import CtaSection from './components/CtaSection.svelte';

	/** @type {import('./$types').PageData} */
	export let data;
</script>

<svelte:head>
	<title>InTheMoment</title>
	<link rel="preload" href={data.initialImage} as="image" fetchpriority="high" />
	{#if data.isMobile}
		<link rel="preload" href="/images/hero/mobile.webp" as="image" fetchpriority="high" />
	{:else}
		<link rel="preload" href="/images/hero/desktop.webp" as="image" fetchpriority="high" />
	{/if}
</svelte:head>

<main>
	<Hero
		backgroundImage="/images/landing/desktop.webp"
		mobileBackgroundImage="/images/landing/mobile.webp"
		initialImage={data.initialImage}
		serverIsMobile={data.isMobile}
	/>
	<Intro />
	<Features />
	<HowItWorks />
	<Benefits />
	<MobileSection />
	<CtaSection />
</main>

<style>
	main {
		width: 100%;
		margin: 0 auto;
		background: var(--background-image);
		background-attachment: var(--background-attachment);
		background-size: var(--background-size);
	}
</style>
