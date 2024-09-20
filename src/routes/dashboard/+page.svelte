<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  $: ({ meditations, featuredMeditation, user } = data);
  $: featuredTitle = featuredMeditation ? featuredMeditation.title.split(' ') : [];

  function getMeditationLink(id: string) {
    return `/list`;
  }
</script>

<svelte:head>
  <title>Dashboard - Meditation List</title>
</svelte:head>

<div class="container">
  <header>
    <div class="top-bar">
      <span class="note">InTheMoment.app | Dev Build 0.1.3</span>
    </div>
    <h2>Recommended</h2>
  </header>

  <div class="featured-card-wrapper">
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

<style>
  .container {
    font-family: 'Lato', Arial, sans-serif;
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
    margin-bottom: 2rem;
    width: 100%;
    padding-top: 56.25%; /* 16:9 aspect ratio (9 / 16 = 0.5625) */
  }

  .featured-card {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #e1e1e1; /* Placeholder background color */
    background-size: cover;
    background-position: center;
    color: white;
    border-radius: 1rem;
    overflow: visible;
    text-decoration: none;
    display: block;
  }

  .featured-card::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 95%;
    height: 40px;
    background: rgb(60, 60, 105);
    filter: blur(20px);
    border-radius: 50%;
    z-index: -1;
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
    color: #333333;
  }

  .meditation-list {
    list-style-type: none;
    padding: 0;
    position: relative;
  }

  .meditation-item {
    display: flex;
    align-items: center;
    background-color: #ffffff4a;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    position: relative;
    transition: background-color 0.2s ease-in-out;
  }

  .meditation-item:hover {
    background-color: #ffffff8a;
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
</style>
