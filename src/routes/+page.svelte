<script lang="ts">
	import Hero from './components/Hero.svelte';
	import Intro from './components/Intro.svelte';
	import Features from './components/Features.svelte';
	import HowItWorks from './components/HowItWorks.svelte';
	import Benefits from './components/Benefits.svelte';
	import MobileSection from './components/MobileSection.svelte';
	import CtaSection from './components/CtaSection.svelte';
</script>

<svelte:head>
	<title>InTheMoment</title>
</svelte:head>

<main>
	<Hero />
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
