<!-- +layout.svelte -->
<script lang="ts">
	import { onNavigate, goto } from '$app/navigation';
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { appContext } from '$lib/stores/appContext';
	import { supabase } from '$lib/supabaseClient';
	import { session as sessionStore } from '$lib/stores/session';
	import { get } from 'svelte/store';

	export let data;
	$: ({ navItems, isNativeApp, session } = data);

	// Update the session store with the initial session
	sessionStore.set(session);

	$: appContext.setIsNativeApp(isNativeApp);

	onMount(() => {
		const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
			const currentSession = get(sessionStore);
			if (newSession?.expires_at !== currentSession?.expires_at) {
				sessionStore.set(newSession);
			} else {
				console.log('No session update needed');
			}
		});

		// Add event listener for messages from React Native
		window.addEventListener('message', handleReactNativeMessage);

		// Add this debugging listener
		window.addEventListener('message', (event) => {
			// Ignore messages from React DevTools
			if (event.data && event.data.source === 'react-devtools-content-script') {
				return;
			}
			console.log('Received message event:', event);
			console.log('Message data:', event.data);
		});

		return () => {
			authListener?.subscription.unsubscribe();
			window.removeEventListener('message', handleReactNativeMessage);
		};
	});

	function handleReactNativeMessage(event: MessageEvent) {
		// Ignore messages from React DevTools
		if (event.data && event.data.source === 'react-devtools-content-script') {
			return;
		}

		try {
			// Check if the event data is a string and attempt to parse it
			if (typeof event.data === 'string') {
				const message = JSON.parse(event.data);
				if (message.type === 'navigation') {
					goto(message.path);
				}
			} else if (typeof event.data === 'object' && event.data !== null) {
				// Handle object messages directly
				if (event.data.type === 'navigation') {
					goto(event.data.path);
				}
			} else {
				console.warn('Received unexpected message format:', event.data);
			}
		} catch (error) {
			console.warn('Error parsing message:', event.data);
			console.error('Parse error details:', error);
		}
	}

	onNavigate((navigation) => {
		if (!document.startViewTransition) {
			console.log('View transitions not supported');
			return;
		}

		console.log('Starting view transition');
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
				console.log('View transition completed');
			});
		});
	});

	$: isHomePage = $page.url.pathname === '/';
	$: navItemCount = navItems ? navItems.length : 5;

	// Determine if we're on mobile or desktop for different nav rendering
	let isMobile = false;

	onMount(() => {
		// Initial check
		checkMobile();

		// Listen for resize events
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	function checkMobile() {
		isMobile = window.innerWidth <= 1024;
	}
</script>

{#if !$appContext.isNativeApp}
	<!-- Desktop Navigation -->
	<nav class="desktop-nav" class:hidden={isMobile}>
		{#each navItems as item}
			<a
				href={item.href}
				class="nav-item"
				class:active={$page.url.pathname === item.href}
				aria-label={item.label}
			>
				<div class="icon-container">
					<i class="fas {item.icon}"></i>
				</div>
				<span class="nav-label">{item.label}</span>
			</a>
		{/each}
	</nav>

	<!-- Mobile Navigation -->
	<nav class="mobile-nav" class:hidden={!isMobile}>
		<div class="mobile-nav-gradient"></div>
		{#each navItems as item}
			<a
				href={item.href}
				class="nav-item"
				class:active={$page.url.pathname === item.href}
				aria-label={item.label}
			>
				<div class="icon-container">
					<i class="fas {item.icon}"></i>
				</div>
				<span class="nav-label">{item.label}</span>
			</a>
		{/each}
	</nav>
{/if}

<main class:full-width={isHomePage} class:native-app={$appContext.isNativeApp}>
	<div class="global-container" class:full-width={isHomePage}>
		<div class="content-container" class:homepage-content={isHomePage}>
			<slot />
		</div>
	</div>
</main>

<style>
	/* Hide nav based on screen size */
	.hidden {
		display: none !important;
	}

	/* Desktop Navigation Styles */
	.desktop-nav {
		position: fixed;
		top: 20px;
		left: 20px;
		background-color: #eaeaea;
		border-radius: 25px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		padding: 15px 10px;
		gap: 15px;
		z-index: 1000;
		width: auto;
		min-width: 60px;
		transition: all 0.3s ease;
	}

	.desktop-nav .nav-item {
		display: flex;
		align-items: center;
		color: #333;
		text-decoration: none;
		transition: all 0.2s ease;
		position: relative;
		padding: 8px 10px;
		border-radius: 12px;
		white-space: nowrap;
	}

	.desktop-nav .nav-item:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}

	.desktop-nav .icon-container {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
		color: #333;
		transition:
			background-color 0.3s ease,
			color 0.3s ease;
		flex-shrink: 0;
		will-change: background-color, color;
	}

	.desktop-nav .nav-item.active .icon-container {
		background-color: #000;
		color: #fff;
	}

	.desktop-nav .nav-item i {
		font-size: 18px;
	}

	.desktop-nav .nav-label {
		font-family: 'Poppins', sans-serif;
		font-weight: 500;
		color: #4c4c4c;
		transition:
			opacity 0.3s ease,
			max-width 0.3s ease,
			margin-left 0.3s ease;
		font-size: 14px;
		opacity: 0;
		max-width: 0;
		overflow: hidden;
	}

	.desktop-nav:hover .nav-label {
		opacity: 1;
		margin-left: 12px;
		max-width: 150px;
	}

	.desktop-nav .nav-item.active .nav-label {
		color: #000;
		font-weight: 600;
	}

	/* Mobile Navigation Styles */
	.mobile-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-around;
		background-color: transparent;
		z-index: 1000;
		padding: 10px 0 20px 0; /* Extra padding at bottom for iOS home indicator */
	}

	.mobile-nav-gradient {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 100%;
		background: linear-gradient(
			to bottom,
			rgba(225, 225, 225, 0.5) 0%,
			rgba(225, 225, 225, 0.8) 40%,
			rgba(225, 225, 225, 0.95) 70%,
			rgba(225, 225, 225, 1) 100%
		);
		backdrop-filter: blur(10px);
		z-index: -1;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.mobile-nav .nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #777;
		text-decoration: none;
		padding: 8px 0;
		flex: 1;
		transition: color 0.2s ease;
		position: relative;
		z-index: 2;
	}

	.mobile-nav .icon-container {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 5px;
		color: #777;
		transition: color 0.3s ease;
		will-change: color;
	}

	.mobile-nav .nav-item i {
		font-size: 22px;
	}

	.mobile-nav .nav-label {
		font-family: 'Poppins', sans-serif;
		font-size: 11px;
		font-weight: 500;
		transition: color 0.3s ease;
	}

	.mobile-nav .nav-item.active {
		color: #000;
	}

	.mobile-nav .nav-item.active i {
		color: #000;
	}

	.mobile-nav .nav-item.active .nav-label {
		color: #000;
		font-weight: 600;
	}

	main.full-width .content-container {
		max-width: none;
		padding: 0;
	}

	.homepage-content {
		padding: 0 !important;
	}

	main.native-app {
		/* padding-bottom: 100px; */
	}

	.content-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 0.5rem;
	}

	.global-container {
		width: 100%;
		box-sizing: border-box;
		margin: 0 auto;
	}

	.global-container.full-width {
		max-width: none;
		padding: 0;
	}

	@media (max-width: 600px) {
		.global-container {
			padding: 0 0.5rem;
		}

		.global-container.full-width {
			padding: 0;
		}
	}

	:global(a:visited) {
		color: inherit;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes fade-out {
		to {
			opacity: 0;
		}
	}

	:root::view-transition-old(root) {
		animation: 500ms cubic-bezier(0.4, 0, 1, 1) both fade-out;
	}

	:root::view-transition-new(root) {
		animation: 500ms cubic-bezier(0, 0, 0.2, 1) both fade-in;
	}

	@media (prefers-reduced-motion) {
		::view-transition-group(*),
		::view-transition-old(*),
		::view-transition-new(*) {
			animation: none !important;
		}
	}
</style>
