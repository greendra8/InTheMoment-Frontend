<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  $: ({ meditations, featuredMeditation, user } = data);
  $: featuredTitle = featuredMeditation ? featuredMeditation.title.split(' ') : [];

  function getMeditationLink(id: string) {
    return `/list`;
  }

  let sliderRef: HTMLElement;
  let slider: any;

  onMount(() => {
    // Ensure images are loaded before initializing the slider
    Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => { img.onload = img.onerror = resolve; }))
    ).then(() => {
      slider = new KeenSlider(sliderRef, {
        loop: true,
        mode: "snap",
        slides: {
          perView: 2.5,
          spacing: 8,
          origin: 0.02, // Add this line to create a gap on the left
        },
        breakpoints: {
          '(min-width: 768px)': {
            slides: {
              perView: 2.5,
              spacing: 16,
            },
          },
        },
      });
    });

    return () => {
      if (slider) slider.destroy();
    };
  });
</script>

<svelte:head>
  <title>Dashboard - Meditation List</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/keen-slider@6.8.5/keen-slider.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/keen-slider@6.8.5/keen-slider.min.js"></script>
</svelte:head>

<div class="container">
  <div class="light-section">
    <header>
      <div class="top-bar">
        <span class="note">InTheMoment.app | Dev Build 0.1.3</span>
      </div>
      <h1>Recommended</h1>
    </header>

    <div class="featured-card-wrapper">
      <div class="featured-card-shadow"></div>
      <a href={getMeditationLink(featuredMeditation?.id)} class="featured-card" style="background-image: url('{featuredMeditation?.backgroundImage ?? ''}'); background-color: #e1e1e1">
        <div class="card-content">
          <h2 class="card-title">
            <span class="title-word">{featuredTitle[0]}</span>
            <span class="title-word">{featuredTitle[1]}</span>
          </h2>
          <p class="card-subtitle">{featuredMeditation?.subtitle}</p>
        </div>
        <div class="card-chevron">
          <i class="fas fa-chevron-right"></i>
        </div>
      </a>
    </div>

    <div bind:this={sliderRef} class="keen-slider">
      {#each meditations as meditation}
        <div class="keen-slider__slide">
          <div class="carousel-item" 
               style="background-image: url('{meditation.backgroundImage}')">
            <div class="carousel-item-content">
              <h3>{meditation.title}</h3>
            </div>
            <a href={getMeditationLink(meditation.id)} class="carousel-item-chevron">
              <i class="fas fa-chevron-right"></i>
            </a>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="dark-section">
    <div class="curve-transition top-curve">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path fill="#e1e1e1" d="M0,100 C480,0 960,100 1440,100 L1440,0 L0,0 Z"></path>
      </svg>
    </div>
    <div class="dark-content">
      <h3 class="section-title">Other Sessions:</h3>

      <div class="meditation-list-container">
        <div class="meditation-list-shadow"></div>
        <ul class="meditation-list">
          {#each meditations.filter(m => !m.isFeatured) as meditation (meditation.id)}
            <li class="meditation-item">
              <a href={getMeditationLink(meditation.id)} class="meditation-link">
                <div class="icon"><i class={meditation.icon}></i></div>
                <div class="content">
                  <h3>{meditation.title}</h3>
                  <p>{meditation.subtitle}</p>
                </div>
                <div class="toggle">
                  <i class="fas fa-chevron-right"></i>
                </div>
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </div>
    <div class="curve-transition bottom-curve">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none" style="transform: translateY(5px);">
        <!-- 5px translation hides 1px black line showing from dark section background -->
        <path fill="#e1e1e1" d="M0,0 C480,100 960,0 1440,0 L1440,100 L0,100 Z"></path>
      </svg>
    </div>
  </div>
</div>

<style>
  .container {
    font-family: 'Lato', Arial, sans-serif;
    overflow: hidden;
    margin: 0 -1.5rem;
  }

  .light-section {
    background-color: #e1e1e1;
    padding: 0 1.5rem;
  }

  .curve-transition {
    display: block;
    width: 100%;
    height: 100px;
  }

  .curve-transition svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .top-curve {
    margin-bottom: -1px; /* Removes tiny gap between curve and dark section */
  }

  .bottom-curve {
    margin-top: -1px; /* Removes tiny gap between curve and dark section */
  }

  .dark-section {
    background-color: #333333;
    color: #FFFFFF;
    padding: 0 1.5rem;
    position: relative;
    margin: 0 -1.5rem;
  }

  .dark-content {
    padding: 0 1.5rem 2rem; /* Added bottom padding */
  }

  .top-bar {
    font-size: 0.8rem;
    color: #AAAAAA;
    margin-bottom: 0.5rem;
    font-weight: 300;
  }

  h1 {
    font-family: 'Poppins', Arial, sans-serif;
    font-weight: 600;
    text-align: left;
    color: #333333;
    margin-bottom: 1rem;
  }

  .featured-card-wrapper {
    position: relative;
    margin-bottom: 2.5rem;
    width: 100%;
    padding-top: 56.25%; /* 16:9 aspect ratio (9 / 16 = 0.5625) */
  }

  .featured-card-shadow {
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 95%;
    height: 40px;
    background: #3c3c69;
    filter: blur(20px);
    border-radius: 50%;
    z-index: 1; /* Place shadow above the wrapper but beneath the card */
  }

  .featured-card {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #e1e1e1;
    background-size: cover;
    background-position: center;
    color: white;
    border-radius: 1rem;
    overflow: hidden; /* Changed from visible to hidden */
    text-decoration: none;
    display: block;
    z-index: 2; /* Ensure card is above the shadow */
  }

  .card-content {
    position: absolute;
    bottom: 2rem;
    left: 2rem;
    right: 3rem; /* Make room for the chevron */
    z-index: 1;
  }

  .featured-card h2 {
    font-family: 'Poppins', Arial, sans-serif;
    line-height: 1.2;
    font-weight: 600;
    margin: 0;
    font-size: 1.5rem;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
  }

  .featured-card h2 .title-word {
    display: block;
  }

  .featured-card p {
    font-size: 0.8rem;
    opacity: 0.9;
    font-weight: 400;
    margin: 0;
    text-shadow: 0 0 8px rgba(0, 0, 0, 0.8), 0 0 16px rgba(0, 0, 0, 0.8);
  }

  .card-chevron {
    position: absolute;
    bottom: 2rem;
    right: 2rem;
    color: white;
    font-size: 1.5rem;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.8);
    transition: transform 0.2s ease-in-out;
  }

  .featured-card:hover .card-chevron {
    transform: scale(1.2);
  }

  .section-title {
    font-family: 'Poppins', Arial, sans-serif;
    font-weight: 600;
    margin: 0;
    color: #ffffff;
    padding-top: 50px; /* Adjust based on the curve height */
    margin-top: 0;
  }

  .meditation-list {
    list-style-type: none;
    padding: 0;
    position: relative;
  }

  .meditation-item {
    display: flex;
    align-items: center;
    background-color: #ffffff;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    position: relative;
    transition: background-color 0.2s ease-in-out;
  }

  .meditation-item:hover {
    background-color: #f5f5f5;
  }

  .meditation-item .content {
    flex-grow: 1;
  }

  .meditation-item .toggle {
    background-color: transparent;
    border: none;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #666666;
    font-size: 1rem;
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
    position: relative;
    z-index: 2;
    transition: transform 0.2s ease-in-out;
  }

  .meditation-item:hover .toggle {
    transform: scale(1.2);
  }

  .meditation-item .icon {
    font-size: 1.5rem;
    margin-right: 1rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333333;
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  }

  .meditation-item h3 {
    font-family: 'Poppins', Arial, sans-serif;
    font-weight: 600;
    margin: 0;
    color: #333333;
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  }

  .meditation-item p {
    margin: 0;
    color: #666666;
    font-size: 0.9rem;
    font-weight: 300;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.1);
  }

  .meditation-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: inherit;
    width: 100%;
  }

  .keen-slider {
    margin: 0 -1.5rem;
    width: calc(100% + 3rem);

  }

  .carousel-item {
    height: 280px;
    background-size: cover;
    background-position: center;
    border-radius: 1rem;
    position: relative;
    overflow: hidden;
  }

  .carousel-item::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
  }

  .carousel-item-content {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    padding-right: 1rem;
    z-index: 2;
  }

  .carousel-item h3 {
    color: white;
    margin: 0;
    font-size: 1.2rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .carousel-item-chevron {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 2;
    color: white;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease-in-out;
    text-decoration: none;
  }

  .carousel-item-chevron:hover {
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    .carousel-item {
      height: 220px;
    }

    .carousel-item h3 {
      font-size: 1rem;
    }

    .carousel-item-chevron {
      width: 1.5rem;
      height: 1.5rem;
    }

    .curve-transition {
      height: 50px; /* Adjust curve height for smaller screens */
    }

    .section-title {
      padding-top: 30px; /* Adjust based on the smaller curve height */
    }

    .dark-content {
      padding-bottom: 1rem; /* Adjust padding for smaller screens */
    }
  }
</style>
