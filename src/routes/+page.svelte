<script>
  import { onMount } from 'svelte';

  onMount(() => {
    console.log('App mounted');
  });
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</svelte:head>

<main class="global-container">
  <section class="hero">
    <h1>Elevate Your Mind with AI-Powered Meditation</h1>
    <p class="tagline">Experience bespoke mindfulness journeys crafted by cutting-edge artificial intelligence</p>
    <div class="cta">
      <a href="/register" class="button primary">Sign Up Now</a>
      <a href="/login" class="button secondary">Welcome Back</a>
    </div>
  </section>
  
  <section class="features">
    <div class="feature">
      <span class="icon">🧠</span>
      <h2>Personalised AI Guidance</h2>
      <p>Our advanced AI analyses your preferences, stress levels, and goals to create truly unique meditation experiences</p>
    </div>
    <div class="feature">
      <span class="icon">🎵</span>
      <h2>Immersive Audio</h2>
      <p>Enjoy crystal-clear guided meditations with dynamic soundscapes and soothing visualisations</p>
    </div>
    <div class="feature">
      <span class="icon">📊</span>
      <h2>Progress Tracking</h2>
      <p>Visualise your mindfulness journey with detailed insights and achievement milestones</p>
    </div>
  </section>

  <section class="how-it-works">
    <h2>How In The Moment Works</h2>
    <div class="steps">
      <div class="step">
        <span class="step-number">1</span>
        <h3>Profile Creation</h3>
        <p>Answer a few questions about your meditation goals and preferences</p>
      </div>
      <div class="step">
        <span class="step-number">2</span>
        <h3>AI Generation</h3>
        <p>Our AI crafts a personalised meditation script and selects appropriate audio</p>
      </div>
      <div class="step">
        <span class="step-number">3</span>
        <h3>Immersive Experience</h3>
        <p>Listen to your custom meditation with our interactive audio player</p>
      </div>
      <div class="step">
        <span class="step-number">4</span>
        <h3>Continuous Improvement</h3>
        <p>Provide feedback to refine future sessions and track your progress</p>
      </div>
    </div>
  </section>

  <section class="features-highlight">
    <h2>Why Choose In The Moment?</h2>
    <div class="highlight-grid">
      <div class="highlight-item">✨ Cutting-edge AI technology for truly personalised experiences</div>
      <div class="highlight-item">🎨 Beautiful, responsive design that works on all your devices</div>
      <div class="highlight-item">🔒 Secure user profiles and data protection</div>
      <div class="highlight-item">🌱 Continuous learning algorithm that grows with you</div>
      <div class="highlight-item">💬 Integration with mood tracking and journaling features</div>
      <div class="highlight-item">🏆 Gamification elements to keep you motivated</div>
    </div>
  </section>

  <section class="mobile-apps">
    <h2>Take In The Moment Everywhere</h2>
    <p class="coming-soon">Native mobile apps for Android and iOS coming soon!</p>
    <div class="app-icons">
      <div class="app-icon">
        <i class="fab fa-android"></i>
        <span>Android</span>
      </div>
      <div class="app-icon">
        <i class="fab fa-apple"></i>
        <span>iOS</span>
      </div>
    </div>
    <p class="offline-support">Enjoy offline support for uninterrupted meditation, anywhere you go</p>
  </section>

  <section class="final-cta">
    <h2>Ready to Transform Your Mindfulness Practice?</h2>
    <p>Join users who have discovered the power of AI-driven meditation</p>
    <a href="/register" class="button primary">Sign Up Now</a>
  </section>
</main>

<style>
  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    color: #333;
  }

  h1, h2 {
    font-family: 'Poppins', sans-serif;
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
    font-weight: bold;
    min-width: 200px;
    box-sizing: border-box;
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

  .cta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
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

  @media (max-width: 600px) {
    .hero {
      padding: 2rem 1rem;
    }

    h1 {
      font-size: 2.5rem;
    }

    .tagline {
      font-size: 1.2rem;
    }

    .features {
      flex-direction: column;
    }

    .feature {
      width: 100%;
      margin-bottom: 1rem;
    }

    .final-cta {
      padding: 2rem 1rem;
    }

    .final-cta h2 {
      font-size: 2rem;
    }

    .button {
      width: 100%;
      max-width: 100%; 
      margin: 0 auto;
      display: block;
      min-width: unset; 
      padding: 1rem 1rem; 
    }
  }

  @media (min-width: 601px) {
    .hero, .features, .final-cta {
      padding-left: 2rem;
      padding-right: 2rem;
    }
  }

  @media (max-width: 600px) {
    .hero, .features, .final-cta {
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }

  .how-it-works {
    margin-bottom: 4rem;
  }

  .steps {
    display: flex;
    justify-content: space-between;
    gap: 2rem;
    margin-top: 2rem;
  }

  .step {
    flex: 1;
    text-align: center;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 12px;
  }

  .step-number {
    display: inline-block;
    width: 30px;
    height: 30px;
    line-height: 30px;
    background-color: #333;
    color: #fff;
    border-radius: 50%;
    margin-bottom: 1rem;
  }

  .features-highlight {
    margin-bottom: 4rem;
  }

  .highlight-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .highlight-item {
    background-color: #f9f9f9;
    padding: 1.5rem;
    border-radius: 12px;
    font-size: 1.1rem;
    text-align: left;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .highlight-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  }

  @media (max-width: 768px) {
    .steps {
      flex-direction: column;
    }

    .highlight-grid {
      grid-template-columns: 1fr;
    }
  }

  .mobile-apps {
    background-color: #f9f9f9;
    padding: 4rem 2rem;
    border-radius: 12px;
    margin-bottom: 4rem;
    text-align: center;
  }

  .mobile-apps h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .coming-soon {
    font-size: 1.2rem;
    color: #555;
    margin-bottom: 2rem;
  }

  .app-icons {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin-bottom: 2rem;
  }

  .app-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .app-icon i {
    font-size: 4rem;
    margin-bottom: 0.5rem;
    color: #333;
  }

  .app-icon span {
    font-weight: bold;
    color: #333;
  }

  .offline-support {
    font-size: 1.1rem;
    color: #555;
    margin-top: 1rem;
  }

  @media (max-width: 600px) {
    .mobile-apps {
      padding: 2rem 1rem;
    }

    .mobile-apps h2 {
      font-size: 2rem;
    }

    .app-icons {
      gap: 2rem;
    }

    .app-icon i {
      font-size: 3rem;
    }
  }
</style>
