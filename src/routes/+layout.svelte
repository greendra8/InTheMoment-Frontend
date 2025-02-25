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
</script>

{#if !$appContext.isNativeApp}
	<nav class="nav">
		{#each navItems as item}
			<a
				href={item.href}
				class="nav-item"
				class:active={$page.url.pathname === item.href}
				aria-label={item.label}
			>
				<div class="icon-container">
					<div class="icon-background">
						<i class="fas {item.icon}"></i>
					</div>
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
	:global(body) {
		font-family: 'Lato', sans-serif;
		line-height: 1.6;
		color: #333;
		background-color: #e1e1e1;
		margin: 0;
		padding: 0;
	}

	.nav {
		position: fixed;
		bottom: 10px;
		left: 50%;
		transform: translateX(-50%);
		background-color: #eaeaea;
		border-radius: 25px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		padding: 10px 0;
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		gap: 10px;
		width: calc(100% - 20px);
		max-width: 400px;
		z-index: 1000;
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: #333;
		text-decoration: none;
		flex: 1;
		transition: transform 0.3s ease;
		position: relative;
		padding: 0 10px;
	}

	.icon-container {
		position: relative;
	}

	.nav-item.active .icon-container::before {
		opacity: 1;
	}

	.icon-background {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		transition: all 0.3s ease;
	}

	.nav-item.active .icon-background {
		background-color: #333;
		color: #fff;
	}

	.nav-item i {
		font-size: 20px;
	}

	.nav-label {
		font-family: 'Poppins', sans-serif;
		font-size: 12px;
		text-align: center;
		display: none;
		margin-bottom: 5px;
		width: 100%;
		font-weight: 600;
		color: #4c4c4c;
	}

	main {
		padding-bottom: 80px;
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

	@media (min-width: 1025px) {
		.nav {
			top: 20px;
			bottom: auto;
			left: 20px;
			transform: none;
			width: auto;
			max-width: none;
			flex-direction: column;
			border-radius: 12px;
			padding: 10px 3px;
			justify-content: flex-start;
		}

		.nav-item {
			flex-direction: column;
			gap: 5px;
			align-items: flex-start;
			padding: 0;
		}

		.icon-container {
			position: relative;
			padding: 0 15px;
		}

		.icon-container::before {
			top: 50%;
			left: -3px;
			transform: translateY(-50%);
			width: 2px;
			height: 35px;
		}

		.nav-label {
			display: block;
		}

		main {
			padding-top: 0;
			padding-bottom: 0;
		}
	}

	@media (max-width: 1024px) {
		.nav {
			/* Adjust width to allow for closer icons */
			width: min(calc(var(--item-count, 5) * 50px + 55px), calc(100% - 20px));
			padding: 8px 20px;
			/* Use space-evenly for even distribution with minimal space */
			justify-content: space-evenly;
			/* Remove any existing gap */
			gap: 0;
			border-radius: 0.5rem;
			box-shadow: 0 0px 7px rgba(0, 0, 0, 0.22);
		}

		.nav-item {
			/* Remove horizontal padding */
			padding: 5px 0;
		}

		.icon-background {
			/* Keep original icon size */
			width: 40px;
			height: 40px;
			border-radius: 50%;
			background-color: #f0f0f0;
			display: flex;
			justify-content: center;
			align-items: center;
			transition: all 0.3s ease;
			/* Remove inner shadow */
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		}

		.nav-item i {
			font-size: 20px;
			/* Add transition for color change */
			transition: color 0.3s ease;
		}

		/* New styles for active state on mobile */
		.nav-item.active .icon-background {
			background-color: #000;
		}

		.nav-item.active i {
			color: #fff;
		}

		/* Remove the existing active indicator */
		.icon-container::before {
			display: none;
			transition: none;
			transform: none;
		}
	}

	@media (max-width: 360px) {
		.nav {
			/* Slightly reduce width for very small screens */
			width: min(calc(var(--item-count, 5) * 45px + 30px), calc(100% - 20px));
			padding: 6px 15px;
		}

		/* Keep icon sizes the same as above */
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
