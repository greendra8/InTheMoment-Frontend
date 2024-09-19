<script lang="ts">
  import { onMount } from 'svelte';

  interface Meditation {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
  }

  let meditations: Meditation[] = [];

  onMount(async () => {
    // Fetch meditations data from an API or load from a store
    meditations = [
      { id: '1', title: 'Mindful Walking', subtitle: 'Experience the world without bumping into things', icon: 'fa-solid fa-walking' },
      { id: '2', title: 'Mindful Breathing', subtitle: 'Remember to inhale and exhale', icon: 'fa-solid fa-wind' },
      { id: '3', title: 'Mindful Focus', subtitle: 'Relax your mind, not your grip on reality', icon: 'fa-solid fa-brain' },
      { id: '4', title: 'Mindful Eating', subtitle: 'Enjoy your food... before it’s gone', icon: 'fa-solid fa-utensils' },
      { id: '5', title: 'Mindful Listening', subtitle: 'Listen to the moment... or at least pretend to', icon: 'fa-solid fa-headphones' },
      { id: '6', title: 'Mindful Loving', subtitle: 'Be present in love... and avoid the doghouse', icon: 'fa-solid fa-heart' },
      { id: '7', title: 'Mindful Living', subtitle: 'Be present in life, even during boring meetings', icon: 'fa-solid fa-life-ring' },
      { id: '8', title: 'Mindful Dying', subtitle: 'Be present in death, but let’s not rush it', icon: 'fa-solid fa-skull' },
      { id: '9', title: 'Mindful Procrastination', subtitle: 'Be present... when you get around to it', icon: 'fa-solid fa-couch' },
    ];
  });

  function toggleMeditation(id: string) {
    // Implement toggle functionality
    console.log(`Toggled meditation ${id}`);
  }
</script>

<svelte:head>
  <title>Meditation List</title>
</svelte:head>

<div class="container">
  <header>
    <div class="top-bar">
      <span class="note">InTheMoment.app | Dev Build 0.1.3</span>
    </div>
    <h1>Recommended</h1>
  </header>

  <div class="featured-card-wrapper">
    <div class="featured-card">
      <div class="card-content">
        <h2 class="card-title">Sleep<br>Mindfulness</h2>
        <p class="card-subtitle">Guided sleep meditations</p>
      </div>
      <div class="card-chevron">
        <i class="fas fa-chevron-right"></i>
      </div>
    </div>
  </div>

  <h3 class="section-title">Other Sessions:</h3>

  <div class="meditation-list-container">
    <div class="meditation-list-shadow"></div>
    <ul class="meditation-list">
      {#each meditations as meditation (meditation.id)}
        <li class="meditation-item">
          <div class="icon"><i class={meditation.icon}></i></div>
          <div class="content">
            <h3>{meditation.title}</h3>
            <p>{meditation.subtitle}</p>
          </div>
          <button class="toggle" on:click={() => toggleMeditation(meditation.id)}>
            <i class="fas fa-chevron-right"></i>
          </button>
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
    background-image: url('$lib/assets/3d.png');
    background-blend-mode: multiply;
    background-size: cover;
    background-position: center;
    color: white;
    border-radius: 1rem;
    overflow: visible;
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
  }

  /* Remove the duplicate .card-chevron style at the bottom */
</style>
