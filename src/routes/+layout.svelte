<!-- +layout.svelte -->
<script lang="ts">
	import { onNavigate, goto } from '$app/navigation';
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { appContext } from '$lib/stores/appContext';
	import { supabase } from '$lib/supabaseClient';
	import { session as sessionStore, type ExtendedSession } from '$lib/stores/session';
	import { get } from 'svelte/store';
	import { theme, isLandingOrAuthPage, setTheme } from '$lib/stores/theme';
	import Notifications from '$lib/components/Notifications.svelte';
	import { browser } from '$app/environment';
	import { setTimezoneOffsetCookie } from '$lib/utils/time';
	import { showSuccess, showInfo } from '$lib/stores/notifications';

	export let data;
	$: ({ isNativeApp, session } = data);

	// Type the session properly as it comes from the server with profile data
	$: typedSession = session as ExtendedSession;

	// Create reactive navItems based on session state
	$: isAdmin = typedSession?.user?.id === 'cf39c581-6b6f-44b7-8c56-f7f64a26637c';
	$: navItems = typedSession?.user
		? [
				{ href: '/dashboard', label: 'Explore', icon: 'fa-compass' },
				{ href: '/library', label: 'Library', icon: 'fa-list' },
				{ href: '/new', label: 'New', icon: 'fa-plus' },
				{ href: '/playlists', label: 'Learn', icon: 'fa-book' },
				{ href: '/profile', label: 'Profile', icon: 'fa-user' }
				//...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: 'fa-cog' }] : [])
			]
		: [
				{ href: '/', label: 'Home', icon: 'fa-home' },
				{ href: '/login', label: 'Login', icon: 'fa-sign-in-alt' },
				{ href: '/register', label: 'Register', icon: 'fa-user-plus' }
			];

	// Force galaxy theme for landing page and auth pages
	$: isLandingOrAuthRoute = isLandingOrAuthPage();

	/**
	 * Theme synchronization strategy:
	 * 1. For landing/auth pages: Always use 'galaxy' theme
	 * 2. During initial render: Use server-provided theme from DB (data.theme)
	 * 3. After initialization: Use the theme store for reactivity
	 *
	 * This approach ensures the correct theme is applied immediately on page load
	 * and prevents mismatches between localStorage and DB themes during reloads.
	 */

	// Store server theme to use during initialization
	let serverTheme = data.theme;

	// Determine which theme to use based on current state
	$: themeValue = isLandingOrAuthRoute
		? 'galaxy'
		: serverTheme && !initialSessionSetupDone
			? serverTheme
			: $theme;

	// Track if we've done initial session setup
	let initialSessionSetupDone = false;

	// Update the session store with the initial session and profile, and sync theme, but only once
	$: if (!initialSessionSetupDone && typedSession) {
		initialSessionSetupDone = true;
		// Set session without triggering unnecessary theme updates
		sessionStore.set(typedSession);

		// Sync theme with server data if not on landing/auth page
		if (!isLandingOrAuthRoute && typedSession.profile?.theme) {
			const profileTheme = typedSession.profile.theme;
			// Validate theme value to avoid type errors
			if (profileTheme === 'gem' || profileTheme === 'galaxy') {
				// Update theme store with DB value (false = don't save back to DB)
				setTheme(profileTheme);
				// Clear serverTheme to let the reactive store take over
				serverTheme = null;
			}
		}
	}

	$: appContext.setIsNativeApp(isNativeApp);

	// Function to handle hash-based messages in the URL
	function handleUrlMessages() {
		if (browser && window.location.hash) {
			const hash = window.location.hash;
			if (hash.includes('#message=')) {
				const message = decodeURIComponent(hash.split('#message=')[1]);

				// remove all + from message and replace with space
				const messageWithoutPlus = message.replace(/\+/g, ' ');

				showInfo(messageWithoutPlus, { autoClose: 15000 });

				// Clear the hash to prevent showing the message again on refresh
				window.history.replaceState(null, '', window.location.pathname + window.location.search);
			}
		}
	}

	// Auth listener for session updates
	let authListener: { subscription: { unsubscribe: () => void } } | null = null;

	onMount(() => {
		// Force galaxy theme on landing/auth pages
		if (isLandingOrAuthRoute && $theme !== 'galaxy') {
			// Use setTheme with saveToDb=false since this is a system change
			setTheme('galaxy');
		}

		// Check for URL message parameters on mount
		handleUrlMessages();

		// Set up auth listener
		const { data: newAuthListener } = supabase.auth.onAuthStateChange((event, newSession) => {
			const currentSession = get(sessionStore);

			// Only update if the session has actually changed
			if (newSession?.expires_at !== currentSession?.expires_at) {
				// Preserve the profile data when updating the session
				if (currentSession?.profile) {
					sessionStore.set({ ...newSession, profile: currentSession.profile } as ExtendedSession);
				} else {
					sessionStore.set(newSession as ExtendedSession);
				}
			}
		});

		authListener = newAuthListener;

		// Add event listener for messages from React Native
		window.addEventListener('message', handleReactNativeMessage);

		// Set timezone offset cookie when the app loads
		if (browser) {
			setTimezoneOffsetCookie();
		}

		return () => {
			window.removeEventListener('message', handleReactNativeMessage);
		};
	});

	// Listen for URL changes to handle hash-based messages
	$: if (browser && $page.url) {
		handleUrlMessages();
	}

	onDestroy(() => {
		// Clean up auth listener
		if (authListener) {
			authListener.subscription.unsubscribe();
		}
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
			}
		} catch (error) {
			// Silently handle parsing errors - likely not intended for us
		}
	}

	onNavigate((navigation) => {
		if (!document.startViewTransition) {
			return;
		}

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	$: hideNav = $page.url.pathname === '/' || $page.url.pathname.includes('/profile-setup');
	$: hideNavMobile = $page.url.pathname.includes('/session/');

	// Determine if we're on mobile or desktop for different nav rendering
	// Set initial value based on window width if available
	let isMobile = typeof window !== 'undefined' ? window.innerWidth <= 1024 : false;
	let lastScrollY = 0;
	let mobileNavSolid = true; // Start with solid nav
	let userInteracting = false;
	let scrollThreshold = 50; // Threshold for when to change transparency

	// Track scroll position for mobile nav transparency
	function handleScroll() {
		if (!isMobile) return;

		const currentScrollY = window.scrollY;

		// Scrolling down - make transparent after threshold
		if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
			mobileNavSolid = false;
		}
		// Scrolling up - make solid
		else if (currentScrollY < lastScrollY) {
			mobileNavSolid = true;
		}

		lastScrollY = currentScrollY;
	}

	// Handle mobile nav interaction
	function handleMobileNavInteraction() {
		userInteracting = true;
		mobileNavSolid = true;

		// Reset after interaction
		setTimeout(() => {
			userInteracting = false;
			// Only make transparent again if we've scrolled down past threshold
			if (window.scrollY > scrollThreshold) {
				mobileNavSolid = false;
			}
		}, 3000);
	}

	onMount(() => {
		// Update mobile check on mount to ensure it's accurate
		checkMobile();

		// Set initial scroll position
		lastScrollY = window.scrollY;

		// Ensure nav is solid on initial load
		mobileNavSolid = true;

		// Listen for resize events
		window.addEventListener('resize', checkMobile);

		// Listen for scroll events
		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			window.removeEventListener('resize', checkMobile);
			window.removeEventListener('scroll', handleScroll);
		};
	});

	function checkMobile() {
		isMobile = window.innerWidth <= 1024;
	}
</script>

<div class={themeValue !== 'galaxy' ? themeValue + '-theme' : ''}>
	{#if !$appContext.isNativeApp && !hideNav}
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
	{/if}

	{#if !$appContext.isNativeApp && !hideNav && !hideNavMobile}
		<!-- Mobile Navigation -->
		<nav
			class="mobile-nav"
			class:solid={mobileNavSolid}
			on:touchstart={handleMobileNavInteraction}
			on:mousedown={handleMobileNavInteraction}
		>
			{#each navItems as item}
				<a
					href={item.href}
					class="nav-item"
					class:active={$page.url.pathname === item.href}
					class:faded={!mobileNavSolid}
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

	<main class:full-width={hideNav} class:native-app={$appContext.isNativeApp}>
		<div class="global-container" class:full-width={hideNav}>
			<div class="content-container" class:homepage-content={hideNav}>
				<slot />
			</div>
		</div>
	</main>

	<Notifications />
</div>

<style>
	/* Hide nav based on screen size */
	.hidden {
		display: none !important;
	}

	/* Desktop Navigation Styles */
	.desktop-nav {
		display: none; /* Hidden by default */
	}

	@media (min-width: 1025px) {
		.desktop-nav {
			display: flex; /* Only show on desktop */
			position: fixed;
			top: 1.25rem; /* 20px */
			left: 1.25rem; /* 20px */
			background-color: var(--background-card);
			border-radius: 1.5625rem; /* 25px */
			box-shadow: 0 0.125rem 0.625rem var(--ui-shadow);
			flex-direction: column;
			padding: 0.9375rem 0.625rem; /* 15px 10px */
			gap: 0.9375rem; /* 15px */
			z-index: 1000;
			width: auto;
			min-width: 3.75rem; /* 60px */
			transition: all 0.3s ease;
		}
	}

	.desktop-nav .nav-item {
		display: flex;
		align-items: center;
		color: var(--text-primary);
		text-decoration: none;
		transition: all 0.2s ease;
		position: relative;
		padding: 0.5rem 0.625rem; /* 8px 10px */
		border-radius: 0.75rem; /* 12px */
		white-space: nowrap;
	}

	.desktop-nav .icon-container {
		width: 2.5rem; /* 40px */
		height: 2.5rem; /* 40px */
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
		color: var(--icon-primary);
		transition: all 0.3s ease;
		flex-shrink: 0;
		will-change: background-color, color;
	}

	.desktop-nav .nav-item.active .icon-container {
		background-color: var(--background-button);
		color: var(--text-light);
	}

	.desktop-nav .nav-item i {
		font-size: 1.125rem; /* 18px */
	}

	.desktop-nav .nav-label {
		font-family: 'Poppins', sans-serif;
		font-weight: 500;
		color: var(--text-secondary);
		transition: all 0.3s ease;
		font-size: 0.875rem; /* 14px */
		opacity: 0;
		max-width: 0;
		overflow: hidden;
	}

	.desktop-nav:hover .nav-label {
		opacity: 1;
		margin-left: 0.75rem; /* 12px */
		max-width: 9.375rem; /* 150px */
	}

	.desktop-nav .nav-item.active .nav-label {
		color: var(--text-primary);
		font-weight: 600;
	}

	.desktop-nav .nav-item:hover {
		background-color: var(--background-cardHover);
	}

	/* Mobile Navigation Styles */
	.mobile-nav {
		display: none; /* Hidden by default */
	}

	@media (max-width: 1024px) {
		main.full-width {
			padding-bottom: 0; /* Don't give extra room for nav bar as it doesn't display on the home page */
		}
		.mobile-nav {
			display: flex; /* Only show on mobile */
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			justify-content: space-around;
			background-color: var(--background-card);
			z-index: 1000;
			padding: 0.625rem 0 1.25rem 0; /* 10px 0 20px 0 */
			transition: all 0.3s ease;
			border-top: 0.0625rem solid var(--ui-border); /* 1px */
		}
	}

	.mobile-nav.solid {
		background-color: rgb(var(--background-card-rgb));
		border-top: 0.0625rem solid var(--ui-border); /* 1px */
	}

	.mobile-nav:not(.solid) {
		background-color: rgba(var(--background-card-rgb), 0.9);
		backdrop-filter: blur(0.0625rem); /* 1px */
	}

	.mobile-nav .nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		text-decoration: none;
		padding: 0.5rem 0; /* 8px 0 */
		flex: 1;
		transition: all 0.3s ease;
		position: relative;
		z-index: 2;
	}

	.mobile-nav .nav-item.faded {
		opacity: 0.7;
	}

	.mobile-nav .nav-item.active.faded {
		opacity: 0.85;
	}

	.mobile-nav .icon-container {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 0.3125rem; /* 5px */
		color: var(--icon-secondary);
		transition: all 0.3s ease;
		will-change: color, opacity;
	}

	.mobile-nav .nav-item i {
		font-size: 1.375rem; /* 22px */
		transition: all 0.3s ease;
	}

	.mobile-nav .nav-label {
		font-family: 'Lato', sans-serif;
		font-size: 0.6875rem; /* 11px */
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.mobile-nav .nav-item.active {
		color: var(--text-primary);
	}

	.mobile-nav .nav-item.active i {
		color: var(--icon-primary);
	}

	.mobile-nav .nav-item.active.faded i {
		color: var(--icon-primary-faded);
	}

	.mobile-nav .nav-item.active .nav-label {
		color: var(--text-primary);
		font-weight: 600;
	}

	.mobile-nav .nav-item.active.faded .nav-label {
		color: var(--text-primary-faded);
	}

	main.full-width .content-container {
		max-width: none;
		padding: 0;
	}

	.homepage-content {
		padding: 0 !important;
	}

	.content-container {
		max-width: 50rem; /* 800px */
		margin: 0 auto;
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
		main.global-container {
			padding: 0;
		}
	}

	/* :global(a:visited) {
		color: inherit;
	} */

	/* Global view transition */

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
		animation: 200ms cubic-bezier(0.4, 0, 1, 1) both fade-out;
	}

	:root::view-transition-new(root) {
		animation: 200ms cubic-bezier(0, 0, 0.2, 1) both fade-in;
	}

	/* Define CSS variables for transparent and faded variants */
	:root {
		--background-card-transparent: rgba(var(--background-card-rgb), 0.5);
		--icon-primary-faded: rgba(var(--icon-primary-rgb), 0.85);
		--text-primary-faded: rgba(var(--text-primary-rgb), 0.85);
	}

	.theme-toggle-container {
		display: flex;
		justify-content: center;
		margin-top: 0.625rem; /* 10px */
	}
</style>
