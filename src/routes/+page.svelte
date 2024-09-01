<script>
  import { onMount } from 'svelte';

  onMount(() => {
    console.log('App mounted');
  });
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@300;400&display=swap" rel="stylesheet">
</svelte:head>

<main>
  <h1>AI Wellbeing</h1>
  <p class="tagline">Personalised meditations for your mental wellness journey</p>
  
  <div class="features">
    <div class="feature">
      <h2>Customised Experience</h2>
      <p>AI-generated meditations tailored to your needs and preferences</p>
    </div>
    <div class="feature">
      <h2>Flexible Durations</h2>
      <p>Choose from 5, 15, or 25-minute sessions to fit your schedule</p>
    </div>
    <div class="feature">
      <h2>Track Your Progress</h2>
      <p>Review your meditation history and see your growth over time</p>
    </div>
  </div>

  <div class="cta">
    <a href="/register" class="button">Get Started</a>
    <a href="/login" class="button secondary">Login</a>
  </div>
</main>

<style>


  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
  }

  h1, h2 {
    font-family: 'Playfair Display', serif;
  }

  h1 {
    font-size: 3.5rem;
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }

  .tagline {
    font-size: 1.4rem;
    color: #7f8c8d;
    margin-bottom: 3rem;
  }

  .features {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4rem;
    gap: 2rem;
  }

  .feature {
    flex: 1;
    padding: 2rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .feature h2 {
    font-size: 1.8rem;
    color: #2c3e50;
    margin-bottom: 1rem;
  }

  .feature p {
    font-size: 1.1rem;
  }

  .cta {
    margin-top: 3rem;
  }

  .button {
    display: inline-block;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    text-decoration: none;
    color: #fff;
    background-color: #3498db;
    border-radius: 4px;
    transition: background-color 0.3s ease, transform 0.2s ease;
    margin: 0 0.5rem;
  }

  .button:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
  }

  .button.secondary {
    background-color: #95a5a6;
  }

  .button.secondary:hover {
    background-color: #7f8c8d;
  }

  @media (max-width: 1024px) {
    main {
      padding: 2rem 1rem;
    }

    .features {
      flex-direction: column;
      align-items: center;
    }

    .feature {
      width: 100%;
      max-width: 500px;
      margin-bottom: 2rem;
    }
  }
</style>
