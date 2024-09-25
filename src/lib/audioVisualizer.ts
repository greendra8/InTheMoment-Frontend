// Volume threshold for "near zero" audio. Lower: more sensitive, Higher: less reactive
const VOLUME_THRESHOLD = 1;

// Delay (ms) before breathing animation starts. Lower: quicker start, Higher: longer pause
const BREATHING_DELAY = 500;

// Transition speed for audio visualization. Lower: smoother, Higher: more responsive
const TRANSITION_SPEED = 0.10;

// Transition speed for breathing mode. Lower: gradual, Higher: sudden
const BREATHING_TRANSITION_SPEED = 0.01;

// Duration of celebration effect in milliseconds
const CELEBRATION_DURATION = 3000;

// Duration of fade-in effect in milliseconds
const FADE_IN_DURATION = 200;

// Initial blur amount in pixels
const INITIAL_BLUR = 5;

// Base radius as a fraction of the maximum radius
const BASE_RADIUS_FRACTION = 0.6;

// Maximum radius as a fraction of the smaller canvas dimension
const MAX_RADIUS_FRACTION = 0.5;

// Amplitude of the breathing effect
const BREATHING_AMPLITUDE = 10;

// Period of the breathing effect in milliseconds
const BREATHING_PERIOD = 2000;

// Number of ripples in the visualization
const RIPPLE_COUNT = 2;

// Glow size base value
const GLOW_SIZE_BASE = 30;

// Ripple base distance
const RIPPLE_BASE_DISTANCE = 15;

// Celebration pulse factor
const CELEBRATION_PULSE_FACTOR = 0.03;

// Celebration ripple factor
const CELEBRATION_RIPPLE_FACTOR = 20;

// Enable/disable different parts of the visualization
const ENABLE_BREATHING = true;
const ENABLE_CELEBRATION = true;
const ENABLE_GLOW = true;
const ENABLE_RIPPLES = true;

export function setupAudioVisualizer(audio: HTMLAudioElement, canvas: HTMLCanvasElement, analyser: AnalyserNode, canvasWidth: number, canvasHeight: number) {
  const canvasCtx = canvas.getContext('2d');
  if (!canvasCtx) {
    console.error('Unable to get 2D context');
    return;
  }

  // analyser.smoothingTimeConstant = 0.8;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const WIDTH = canvasWidth;
  const HEIGHT = canvasHeight;
  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;
  const maxRadius = Math.min(WIDTH, HEIGHT) * MAX_RADIUS_FRACTION;

  let startTime = Date.now();
  let lastPulseRadius = maxRadius * BASE_RADIUS_FRACTION;
  let isBreathing = false;
  let quietTime = 0;

  let isCelebrating = false;
  let celebrationStartTime = 0;

  let opacity = 0;
  let blur = INITIAL_BLUR;
  const startTimeFade = Date.now();

  function draw() {
    requestAnimationFrame(draw);

    const currentTime = Date.now();
    const fadeProgress = Math.min((currentTime - startTimeFade) / FADE_IN_DURATION, 1);
    opacity = fadeProgress;
    blur = blur * (1 - fadeProgress);

    analyser.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((sum, value) => sum + value, 0) / analyser.frequencyBinCount;

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const baseRadius = maxRadius * BASE_RADIUS_FRACTION;

    let breathingEffect = 0;
    if (ENABLE_BREATHING) {
      breathingEffect = Math.sin((Date.now() - startTime) / BREATHING_PERIOD) * BREATHING_AMPLITUDE;
    }

    let targetRadius;
    if (audio.paused || average < VOLUME_THRESHOLD) {
      quietTime += 16; // Assuming 60fps, each frame is about 16ms
      if (quietTime >= BREATHING_DELAY) {
        isBreathing = true;
      }
    } else {
      quietTime = 0;
      isBreathing = false;
    }

    if (isBreathing) {
      targetRadius = baseRadius + breathingEffect;
    } else {
      targetRadius = baseRadius + (average / 255) * (maxRadius * 0.4); // Increased reactivity
    }

    const currentTransitionSpeed = isBreathing ? BREATHING_TRANSITION_SPEED : TRANSITION_SPEED;
    lastPulseRadius = lastPulseRadius + (targetRadius - lastPulseRadius) * currentTransitionSpeed;

    const pulseRadius = lastPulseRadius;

    let celebrationFactor = 0;
    if (ENABLE_CELEBRATION && isCelebrating) {
      const celebrationProgress = (Date.now() - celebrationStartTime) / CELEBRATION_DURATION;
      celebrationFactor = Math.sin(celebrationProgress * Math.PI * 8) * (1 - celebrationProgress) * CELEBRATION_PULSE_FACTOR;
    }

    const celebrationPulseRadius = pulseRadius * (1 + celebrationFactor);

    const gradient = canvasCtx.createRadialGradient(
      centerX - celebrationPulseRadius * 0.3,
      centerY - celebrationPulseRadius * 0.3,
      0,
      centerX,
      centerY,
      celebrationPulseRadius
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 + average / 1000})`);
    gradient.addColorStop(0.7, `rgba(200, 220, 255, ${0.7 + average / 1500})`);
    gradient.addColorStop(1, `rgba(150, 180, 255, ${0.5 + average / 2000})`);

    canvasCtx.beginPath();
    canvasCtx.arc(centerX, centerY, celebrationPulseRadius, 0, 2 * Math.PI);
    canvasCtx.fillStyle = gradient;
    canvasCtx.fill();

    const highlightGradient = canvasCtx.createRadialGradient(
      centerX - pulseRadius * 0.5,
      centerY - pulseRadius * 0.5,
      0,
      centerX - pulseRadius * 0.3,
      centerY - pulseRadius * 0.3,
      pulseRadius
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    canvasCtx.beginPath();
    canvasCtx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
    canvasCtx.fillStyle = highlightGradient;
    canvasCtx.fill();

    if (ENABLE_GLOW) {
      const glowSize = GLOW_SIZE_BASE + average / 4 + (ENABLE_BREATHING ? breathingEffect / 2 : 0);
      const glowGradient = canvasCtx.createRadialGradient(
        centerX,
        centerY,
        pulseRadius - glowSize,
        centerX,
        centerY,
        pulseRadius + glowSize
      );
      glowGradient.addColorStop(0, 'rgba(150, 180, 255, 0)');
      glowGradient.addColorStop(0.5, `rgba(150, 180, 255, ${0.1 + average / 1500})`);
      glowGradient.addColorStop(1, 'rgba(150, 180, 255, 0)');

      canvasCtx.beginPath();
      canvasCtx.arc(centerX, centerY, pulseRadius + glowSize, 0, 2 * Math.PI);
      canvasCtx.fillStyle = glowGradient;
      canvasCtx.fill();
    }

    if (ENABLE_RIPPLES) {
      for (let i = 1; i <= RIPPLE_COUNT; i++) {
        let rippleRadius = baseRadius + (i * RIPPLE_BASE_DISTANCE) + Math.sin(Date.now() / (800 - i * 200)) * (3 + average / 30);
        let rippleOpacity = 0.2 - i * 0.03 + average / 1000;
        let rippleWidth = 1 + average / 100;

        if (ENABLE_CELEBRATION && isCelebrating) {
          const celebrationProgress = (Date.now() - celebrationStartTime) / CELEBRATION_DURATION;
          const celebrationFactor = Math.sin(celebrationProgress * Math.PI * 4) * (1 - celebrationProgress);
          rippleRadius += celebrationFactor * CELEBRATION_RIPPLE_FACTOR;
          rippleOpacity += celebrationFactor * 0.15;
          rippleWidth += celebrationFactor * 1.1;
        }

        rippleRadius = Math.min(rippleRadius, maxRadius);

        canvasCtx.beginPath();
        canvasCtx.arc(centerX, centerY, rippleRadius, 0, 2 * Math.PI);
        canvasCtx.strokeStyle = `rgba(150, 180, 255, ${rippleOpacity})`;
        canvasCtx.lineWidth = rippleWidth;
        canvasCtx.stroke();
      }
    }

    if (ENABLE_CELEBRATION && isCelebrating && Date.now() - celebrationStartTime > CELEBRATION_DURATION) {
      isCelebrating = false;
    }

    canvasCtx.filter = `blur(${blur}px)`;
    canvasCtx.globalAlpha = opacity;

    canvasCtx.filter = 'none';
    canvasCtx.globalAlpha = 1;
  }

  function startCelebration() {
    isCelebrating = true;
    celebrationStartTime = Date.now();
  }

  function updateCanvasSize(newWidth: number, newHeight: number) {
    WIDTH = newWidth;
    HEIGHT = newHeight;
    centerX = WIDTH / 2;
    centerY = HEIGHT / 2;
    maxRadius = Math.min(WIDTH, HEIGHT) * MAX_RADIUS_FRACTION;
  }

  draw();

  return {
    startCelebration,
    updateCanvasSize
  };
}
