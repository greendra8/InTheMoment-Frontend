<script>
  import { onMount } from 'svelte';

  onMount(() => {
    console.log('App mounted');
  });
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
</svelte:head>

<main>
  <section class="hero">
    <h1>Discover Inner Peace with AI Wellbeing</h1>
    <p class="tagline">Embark on a personalized meditation journey powered by artificial intelligence</p>
    <div class="cta">
      <a href="/register" class="button primary">Start Your Journey</a>
      <a href="/login" class="button secondary">Welcome Back</a>
    </div>
  </section>
  
  <section class="features">
    <div class="feature">
      <span class="icon">🧠</span>
      <h2>AI-Powered Personalization</h2>
      <p>Experience meditations tailored to your unique needs and preferences</p>
    </div>
    <div class="feature">
      <span class="icon">⏱️</span>
      <h2>Flexible Sessions</h2>
      <p>Choose from 5, 15, or 25-minute meditations to fit your busy lifestyle</p>
    </div>
    <div class="feature">
      <span class="icon">📈</span>
      <h2>Track Your Growth</h2>
      <p>Visualize your progress and celebrate your mindfulness milestones</p>
    </div>
  </section>

  <section class="testimonial">
    <blockquote>"AI Wellbeing has transformed my daily routine. I feel more centered and focused than ever before!"</blockquote>
    <cite>- Sarah K., Mindfulness Enthusiast</cite>
  </section>

  <section class="final-cta">
    <h2>Ready to Transform Your Mind?</h2>
    <a href="/register" class="button primary">Begin Your Free Trial</a>
  </section>
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    color: #333;
  }

  h1, h2 {
    font-family: 'Playfair Display', serif;
  }

  .hero {
    background-color: #f5f5f5;
    color: #333;
    padding: 4rem 2rem;
    border-radius: 12px;
    margin-bottom: 4rem;
  }

  h1 {
    font-size: 3.5rem;
    margin-bottom: 1rem;
  }

  .tagline {
    font-size: 1.4rem;
    margin-bottom: 2rem;
    color: #555;
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
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.05);
    transition: transform 0.3s ease;
  }

  .feature:hover {
    transform: translateY(-5px);
  }

  .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
  }

  .feature h2 {
    font-size: 1.8rem;
    color: #333;
    margin-bottom: 1rem;
  }

  .feature p {
    font-size: 1.1rem;
    color: #555;
  }

  .testimonial {
    background-color: #f9f9f9;
    padding: 3rem;
    border-radius: 12px;
    margin-bottom: 4rem;
  }

  blockquote {
    font-size: 1.4rem;
    font-style: italic;
    margin-bottom: 1rem;
    color: #444;
  }

  cite {
    font-weight: bold;
    color: #555;
  }

  .final-cta {
    background-color: #f5f5f5;
    color: #333;
    padding: 3rem;
    border-radius: 12px;
  }

  .final-cta h2 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
  }

  .button {
    display: inline-block;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    text-decoration: none;
    color: #333;
    background-color: #fff;
    border: 2px solid #333;
    border-radius: 50px;
    transition: all 0.3s ease;
    margin: 0 0.5rem;
    font-weight: bold;
  }

  .button:hover {
    background-color: #f0f0f0;
    transform: translateY(-2px);
  }

  .button.primary {
    background-color: #333;
    color: #fff;
  }

  .button.primary:hover {
    background-color: #444;
  }

  .button.secondary {
    background-color: transparent;
  }

  .button.secondary:hover {
    background-color: rgba(0, 0, 0, 0.05);
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
