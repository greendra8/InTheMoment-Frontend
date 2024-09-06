<script lang="ts">
  import '../app.css';
  import { invalidate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { appContext } from '$lib/stores/appContext';
  

  export let data;
  $: ({ session, supabase, navItems } = data);

  onMount(() => {
    const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
      if (newSession?.expires_at !== session?.expires_at) {
        invalidate('supabase:auth');
      }
    });

    // Add Darkmode.js script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/darkmode-js@1.5.7/lib/darkmode-js.min.js';
    script.onload = () => {
      const options = {
        bottom: '64px',
        right: 'unset',
        left: '32px',
        time: '0.5s',
        mixColor: '#fff',
        backgroundColor: '#fff',
        buttonColorDark: '#4CAF50',
        buttonColorLight: '#fff',
        saveInCookies: true,
        label: '🌓',
        autoMatchOsTheme: true
      };

      function addDarkmodeWidget() {
        new Darkmode(options).showWidget();
      }
      addDarkmodeWidget();
    };
    document.head.appendChild(script);

    // Check if running in native app
    if (window.isNativeApp) {
      appContext.setIsNativeApp(true);
    }

    // Check data attribute
    if (document.body.dataset.nativeApp === 'true') {
      appContext.setIsNativeApp(true);
    }

    // Listen for custom event
    window.addEventListener('nativeAppReady', () => {
      appContext.setIsNativeAppReady(true);
      // Perform any app-specific initializations here
    });

    // To send a message to the React Native app
    if (window.sendToReactNative) {
      // You can create a wrapper function if you need to use this often
      window.sendToReactNativeMessage = (type: string, data: any) => {
        window.sendToReactNative({ type, data });
      };
    }

    return () => data.subscription.unsubscribe();
  });

  $: isHomePage = $page.url.pathname === '/';
  $: isNativeApp = $appContext.isNativeApp;

  console.log('isNativeApp', isNativeApp);
</script>

{#if !isNativeApp}
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
<main class:full-width={isHomePage} class:native-app={isNativeApp}>
  <div class="global-container" class:full-width={isHomePage}>
    <div class="content-container">
      <slot />
    </div>
  </div>
</main>

<style>
  :global(body) {
    font-family: 'Roboto', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
  }

  .nav {
    position: fixed;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #fff;
    border-radius: 25px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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

  .icon-container::before {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 45px;
    height: px;
    background-color: #45a049;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .nav-item.active .icon-container::before {
    opacity: 1;
  }

  .icon-background {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #f0f0f0;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1), inset 0 0 0 rgba(0,0,0,0.2);
  }

  .nav-item:hover .icon-background {
    background-color: #e8e8e8;
  }

  .nav-item.active .icon-background {
    background-color: #e0e0e0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05), inset 0 2px 4px rgba(0,0,0,0.1);
  }

  .nav-item i {
    font-size: 20px;
  }

  .nav-label {
    font-size: 12px;
    text-align: center;
    display: none;
    margin-top: 5px;
    width: 100%;
  }

  main {
    padding-bottom: 80px;
  }

  main.full-width .content-container {
    max-width: none;
    padding: 0;
  }

  .content-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
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
      padding: 10px 0;
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
      left: 0;
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
    .content-container {
      padding: 1rem 0.5rem;
    }
  }

  @media (max-width: 600px) {
    .content-container {
      padding: 0.5rem;
    }

    main {
      padding-bottom: 70px;
    }
  }

  .global-container {
    width: 100%;
    box-sizing: border-box;

    margin: 0 auto;
  }

  .global-container.full-width {
    max-width: none;
  }

  @media (max-width: 600px) {
    .global-container {
      padding: 0 0.5rem;
    }
  }

  :global(a:visited) {
    color: inherit;
  }
</style>
