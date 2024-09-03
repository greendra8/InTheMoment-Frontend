export function setupAudioVisualizer(audio: HTMLAudioElement, canvas: HTMLCanvasElement, analyser: AnalyserNode) {
  
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) {
          console.error('Unable to get 2D context');
          return;
        }
    
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
    
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;
        const centerX = WIDTH / 2;
        const centerY = HEIGHT / 2;
        const maxRadius = Math.min(WIDTH, HEIGHT) / 2;
    
    
        let startTime = Date.now();
    
        function draw() {
          requestAnimationFrame(draw);
    
          if (!audio.paused) {
            analyser.getByteFrequencyData(dataArray);
          }
    
          const average = audio.paused ? 0 : dataArray.reduce((sum, value) => sum + value, 0) / analyser.frequencyBinCount;
    
          canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    
          const baseRadius = maxRadius * 0.6;
          const breathingEffect = Math.sin((Date.now() - startTime) / 2000) * 10; // Slow breathing effect
          const pulseRadius = baseRadius + breathingEffect + (average / 255) * (maxRadius * 0.2);
          
          // Create 3D orb effect
          const gradient = canvasCtx.createRadialGradient(
            centerX - pulseRadius * 0.3,
            centerY - pulseRadius * 0.3,
            0,
            centerX,
            centerY,
            pulseRadius
          );
          gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 + average / 1000})`);
          gradient.addColorStop(0.7, `rgba(200, 220, 255, ${0.7 + average / 1500})`);
          gradient.addColorStop(1, `rgba(150, 180, 255, ${0.5 + average / 2000})`);
    
          canvasCtx.beginPath();
          canvasCtx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
          canvasCtx.fillStyle = gradient;
          canvasCtx.fill();
    
          // Add highlight for 3D effect
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
    
          // Add pulsing glow
          const glowSize = 30 + average / 4 + breathingEffect / 2;
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
    
          // Add subtle ripple effect
          for (let i = 1; i <= 2; i++) {
            const rippleRadius = baseRadius + (i * 15) + Math.sin(Date.now() / (800 - i * 200)) * (3 + average / 60) + breathingEffect;
            canvasCtx.beginPath();
            canvasCtx.arc(centerX, centerY, rippleRadius, 0, 2 * Math.PI);
            canvasCtx.strokeStyle = `rgba(150, 180, 255, ${0.1 - i * 0.03 + average / 2500})`;
            canvasCtx.lineWidth = 1 + average / 200;
            canvasCtx.stroke();
          }
        }
    
        draw();
      }
    