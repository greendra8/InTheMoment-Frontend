<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { browser } from '$app/environment';

	export let isMindfulnessActive = false;
	export let toggleCenter = { x: 0, y: 0 };

	let prevMindfulnessState = false;
	let loaded = false;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;
	let iconsArray: DistractionIcon[] = [];
	let animationFrameId: number;

	// Font Awesome icons with their CSS classes and colors
	const iconTypes = [
		// Social media
		{ name: 'instagram', cssClass: 'fab fa-instagram', color: '#C13584' },
		{ name: 'facebook', cssClass: 'fab fa-facebook', color: '#4267B2' },
		{ name: 'tiktok', cssClass: 'fab fa-tiktok', color: '#EE1D52' },
		{ name: 'twitter', cssClass: 'fab fa-twitter', color: '#1DA1F2' },
		{ name: 'youtube', cssClass: 'fab fa-youtube', color: '#FF0000' },
		{ name: 'snapchat', cssClass: 'fab fa-snapchat', color: '#FFFC00' },
		{ name: 'whatsapp', cssClass: 'fab fa-whatsapp', color: '#25D366' },
		{ name: 'telegram', cssClass: 'fab fa-telegram', color: '#0088cc' },
		{ name: 'discord', cssClass: 'fab fa-discord', color: '#5865F2' },
		{ name: 'twitch', cssClass: 'fab fa-twitch', color: '#6441A4' },
		{ name: 'reddit-square', cssClass: 'fab fa-reddit-square', color: '#FF4500' },
		{ name: 'pinterest', cssClass: 'fab fa-pinterest', color: '#E60023' },

		// Notifications & Interactions
		{ name: 'bell', cssClass: 'fas fa-bell', color: '#FFA500' },
		{ name: 'envelope', cssClass: 'fas fa-envelope', color: '#4285F4' },
		{ name: 'comment', cssClass: 'fas fa-comment', color: '#34B7F1' },
		{ name: 'heart', cssClass: 'fas fa-heart', color: '#FF6B6B' },
		{ name: 'thumbs-up', cssClass: 'fas fa-thumbs-up', color: '#3B5998' },
		{ name: 'star', cssClass: 'fas fa-star', color: '#FFD700' },
		{ name: 'notification', cssClass: 'fas fa-bell', color: '#FF4500' },
		{ name: 'share', cssClass: 'fas fa-share', color: '#00acee' },

		// Devices
		{ name: 'mobile-alt', cssClass: 'fas fa-mobile-alt', color: '#A0A0A0' },
		{ name: 'laptop', cssClass: 'fas fa-laptop', color: '#808080' },
		{ name: 'desktop', cssClass: 'fas fa-desktop', color: '#696969' },
		{ name: 'tablet-alt', cssClass: 'fas fa-tablet-alt', color: '#909090' },
		{ name: 'headphones', cssClass: 'fas fa-headphones', color: '#555555' },
		{ name: 'tv', cssClass: 'fas fa-tv', color: '#444444' },

		// Misc digital elements
		{ name: 'hashtag', cssClass: 'fas fa-hashtag', color: '#1DA1F2' },
		{ name: 'at', cssClass: 'fas fa-at', color: '#1877f2' },
		{ name: 'camera', cssClass: 'fas fa-camera', color: '#E1306C' },
		{ name: 'wifi', cssClass: 'fas fa-wifi', color: '#4CAF50' }
	];

	// Create DOM elements for each icon to use for canvas drawing
	let iconElements: { [key: string]: HTMLElement } = {};

	function createIconElements() {
		if (!browser) return;

		// Create a hidden container to hold our icon elements
		const container = document.createElement('div');
		container.style.position = 'absolute';
		container.style.visibility = 'hidden';
		container.style.pointerEvents = 'none';
		document.body.appendChild(container);

		// Create an element for each icon type
		iconTypes.forEach((icon) => {
			const element = document.createElement('i');
			element.className = icon.cssClass;
			container.appendChild(element);
			iconElements[icon.name] = element;
		});

		// Clean up function to remove icons when component unmounts
		return () => {
			if (container && container.parentNode) {
				container.parentNode.removeChild(container);
			}
		};
	}

	class DistractionIcon {
		x: number;
		y: number;
		size: number;
		speedX: number;
		speedY: number;
		rotation: number;
		rotationSpeed: number;
		icon: (typeof iconTypes)[number];
		opacity: number;
		// For mindfulness animation
		targetX: number;
		targetY: number;
		originalX: number;
		originalY: number;
		originalSpeedX: number;
		originalSpeedY: number;
		isSuckedIn: boolean;
		explosionSpeed: number;
		attractionSpeed: number;
		originalSize: number;
		explodeAngle?: number; // Store explosion angle for consistency
		readyToExplode: boolean; // Flag to control when the icon starts exploding

		constructor() {
			this.x = Math.random() * (canvas?.width || window.innerWidth);
			this.y = Math.random() * (canvas?.height || window.innerHeight);
			this.originalX = this.x;
			this.originalY = this.y;
			this.size = Math.random() * 15 + 12;
			this.speedX = (Math.random() - 0.5) * 1.5;
			this.speedY = (Math.random() - 0.5) * 1.5;
			this.originalSpeedX = this.speedX;
			this.originalSpeedY = this.speedY;
			this.rotation = Math.random() * Math.PI * 2;
			this.rotationSpeed = (Math.random() - 0.5) * 0.02;
			this.icon = iconTypes[Math.floor(Math.random() * iconTypes.length)];
			this.opacity = Math.random() * 0.5 + 0.3;
			// Initialize mindfulness animation properties
			this.targetX = 0;
			this.targetY = 0;
			this.isSuckedIn = false;
			this.explosionSpeed = Math.random() * 8 + 15; // Higher value for more dramatic explosion
			this.attractionSpeed = Math.random() * 0.08 + 0.12; // Higher value for faster attraction
			this.originalSize = this.size; // Store original size for restoration
			this.readyToExplode = false; // Not ready to explode initially
		}

		update() {
			// If mindfulness is active, move towards the toggle button
			if (isMindfulnessActive && !this.isSuckedIn) {
				const dx = toggleCenter.x - this.x;
				const dy = toggleCenter.y - this.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				// Gradually transition from current velocity to attraction
				// The further away, the more gradual the transition
				const transitionFactor = Math.min(0.03, 0.15 / (distance * 0.01 + 1));

				// Calculate target speed with distance-based pull
				const pull = Math.min(5, 10 / (distance + 1)) * this.attractionSpeed;
				const targetSpeedX = dx * pull;
				const targetSpeedY = dy * pull;

				// Smoothly transition current speed to target speed
				this.speedX = this.speedX * (1 - transitionFactor) + targetSpeedX * transitionFactor;
				this.speedY = this.speedY * (1 - transitionFactor) + targetSpeedY * transitionFactor;

				// Increase rotation gradually as it gets sucked in
				const targetRotation = 0.1 * (1 + 5 / (distance + 1));
				this.rotationSpeed = this.rotationSpeed * 0.95 + targetRotation * 0.05;

				// If very close to target, start shrinking
				if (distance < 30) {
					// Shrink the icon gradually as it gets closer to the center
					this.size = Math.max(1, this.size * 0.95);
					this.opacity = Math.max(0.05, this.opacity * 0.92);

					// If very small, mark as sucked in
					if (this.size < 3 || this.opacity < 0.05) {
						this.isSuckedIn = true;
						this.opacity = 0; // Hide once sucked in
						this.x = toggleCenter.x;
						this.y = toggleCenter.y;
						this.size = 0; // Completely shrink it
					}
				}

				// Actually move the icon
				this.x += this.speedX;
				this.y += this.speedY;
			}
			// If mindfulness was just turned off, explode outward
			else if (!isMindfulnessActive && this.isSuckedIn && this.readyToExplode) {
				// If this is the first frame of explosion for this icon
				if (this.size === 0) {
					// Calculate direction away from toggle - biased downward and to sides
					// Create a more natural explosion pattern - ONLY going downward and to sides
					let angle;

					// Random angle from -140 to +140 degrees (avoiding upward directions)
					// This spreads icons mainly downward and to the sides
					const range = Math.PI * 0.78; // ~140 degrees
					angle = Math.random() * (2 * range) - range;

					// Store the explosion angle for this icon
					this.explodeAngle = angle;

					// Set velocity based on explosion speed
					this.speedX = Math.cos(angle) * this.explosionSpeed;
					this.speedY = Math.sin(angle) * this.explosionSpeed;

					// Ensure there's a minimum downward component to the velocity
					if (this.speedY < this.explosionSpeed * 0.3) {
						this.speedY = this.explosionSpeed * 0.3;
					}
				}

				// Gradually grow and become visible
				this.size = Math.min(this.originalSize, this.size + this.originalSize * 0.1);
				this.opacity = Math.min(this.opacity + 0.08, 0.8);

				// Move according to explosion velocity
				this.x += this.speedX;
				this.y += this.speedY;

				// Gradually slow down
				this.speedX *= 0.96;
				this.speedY *= 0.96;

				// Once it's nearly stopped and fully visible, return to normal movement
				if (
					(Math.abs(this.speedX) < 2 && Math.abs(this.speedY) < 2) ||
					this.size >= this.originalSize
				) {
					this.isSuckedIn = false;
					this.speedX = this.originalSpeedX;
					this.speedY = this.originalSpeedY;
					this.readyToExplode = false;
				}
			}
			// Regular movement
			else if (!this.isSuckedIn) {
				// Move the icon
				this.x += this.speedX;
				this.y += this.speedY;
				this.rotation += this.rotationSpeed;

				// Bounce off edges
				if (this.x <= 0 || this.x >= (canvas?.width || window.innerWidth)) {
					this.speedX = -this.speedX;
				}

				if (this.y <= 0 || this.y >= (canvas?.height || window.innerHeight)) {
					this.speedY = -this.speedY;
				}

				// Slightly vary the opacity for a pulsing effect
				this.opacity = Math.max(0.3, Math.min(0.8, this.opacity + (Math.random() - 0.5) * 0.01));
			}
		}

		draw() {
			if (!ctx) return;

			ctx.save();
			ctx.translate(this.x, this.y);
			ctx.rotate(this.rotation);
			ctx.globalAlpha = this.opacity;

			// Create a colored background circle
			ctx.fillStyle = this.icon.color;
			ctx.beginPath();
			ctx.arc(0, 0, this.size, 0, Math.PI * 2);
			ctx.fill();

			// Instead of using fillText with Unicode, we'll just draw a white symbol
			// A simplified representation of the icon (since we can't render HTML in canvas)
			ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
			ctx.beginPath();

			// Draw a simple shape based on the icon type
			// We'll use basic shapes that loosely represent the icon categories
			if (
				this.icon.name.includes('facebook') ||
				this.icon.name.includes('twitter') ||
				this.icon.name.includes('instagram') ||
				this.icon.name.includes('youtube')
			) {
				// Social media icons - draw a simple dot
				ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
			} else if (this.icon.name.includes('bell') || this.icon.name.includes('notification')) {
				// Notification icons - draw a small triangle
				const size = this.size * 0.4;
				ctx.moveTo(0, -size);
				ctx.lineTo(size, size);
				ctx.lineTo(-size, size);
			} else if (
				this.icon.name.includes('mobile') ||
				this.icon.name.includes('laptop') ||
				this.icon.name.includes('desktop')
			) {
				// Device icons - draw a rectangle
				const size = this.size * 0.4;
				ctx.rect(-size, -size, size * 2, size * 2);
			} else {
				// Default - simple plus symbol
				const size = this.size * 0.4;
				ctx.moveTo(-size, 0);
				ctx.lineTo(size, 0);
				ctx.moveTo(0, -size);
				ctx.lineTo(0, size);
			}

			ctx.fill();
			ctx.restore();
		}

		// Check collision with another icon
		checkCollision(other: DistractionIcon) {
			const dx = this.x - other.x;
			const dy = this.y - other.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const minDistance = this.size + other.size;

			if (distance < minDistance) {
				// Move icons apart immediately to prevent sticking
				const overlap = minDistance - distance;
				const angle = Math.atan2(dy, dx);

				// Move away from each other proportionally to their sizes
				const totalSize = this.size + other.size;
				const moveRatio1 = other.size / totalSize;
				const moveRatio2 = this.size / totalSize;

				this.x += Math.cos(angle) * overlap * moveRatio1;
				this.y += Math.sin(angle) * overlap * moveRatio1;
				other.x -= Math.cos(angle) * overlap * moveRatio2;
				other.y -= Math.sin(angle) * overlap * moveRatio2;

				// More natural collision physics
				const nx = dx / distance;
				const ny = dy / distance;
				const p =
					(2 * (this.speedX * nx + this.speedY * ny - other.speedX * nx - other.speedY * ny)) /
					(this.size + other.size);

				// Apply velocity changes
				this.speedX = this.speedX - p * other.size * nx;
				this.speedY = this.speedY - p * other.size * ny;
				other.speedX = other.speedX + p * this.size * nx;
				other.speedY = other.speedY + p * this.size * ny;

				// Add a small damping effect to prevent perpetual motion
				const damping = 0.97;
				this.speedX *= damping;
				this.speedY *= damping;
				other.speedX *= damping;
				other.speedY *= damping;

				// Limit rotation speed
				const maxRotationSpeed = 0.015;
				this.rotationSpeed = Math.max(
					-maxRotationSpeed,
					Math.min(maxRotationSpeed, this.rotationSpeed)
				);
				other.rotationSpeed = Math.max(
					-maxRotationSpeed,
					Math.min(maxRotationSpeed, other.rotationSpeed)
				);

				// Draw a connection line between colliding icons
				if (ctx) {
					ctx.beginPath();
					ctx.strokeStyle = `rgba(147, 112, 219, ${0.15 - distance / (minDistance * 10)})`;
					ctx.lineWidth = 0.5;
					ctx.moveTo(this.x, this.y);
					ctx.lineTo(other.x, other.y);
					ctx.stroke();
				}
			}
		}
	}

	function initIcons() {
		if (!canvas) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		// Calculate the number of icons based on screen size
		const iconCount = Math.min(35, Math.floor((canvas.width * canvas.height) / 25000));
		iconsArray = [];

		for (let i = 0; i < iconCount; i++) {
			iconsArray.push(new DistractionIcon());
		}
	}

	function animate() {
		if (!ctx || !canvas) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Apply proper scaling for consistent display across devices
		const devicePixelRatio = window.devicePixelRatio || 1;
		if (window.innerWidth <= 768 && devicePixelRatio !== 1) {
			ctx.save();
			ctx.scale(1 / devicePixelRatio, 1 / devicePixelRatio);
		}

		// Draw connection lines between nearby icons
		for (let i = 0; i < iconsArray.length; i++) {
			for (let j = i + 1; j < iconsArray.length; j++) {
				const icon1 = iconsArray[i];
				const icon2 = iconsArray[j];
				const dx = icon1.x - icon2.x;
				const dy = icon1.y - icon2.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < 150) {
					ctx.beginPath();
					ctx.strokeStyle = `rgba(147, 112, 219, ${0.2 - distance / 750})`;
					ctx.lineWidth = 0.5;
					ctx.moveTo(icon1.x, icon1.y);
					ctx.lineTo(icon2.x, icon2.y);
					ctx.stroke();
				}
			}
		}

		// Update and draw icons
		for (let i = 0; i < iconsArray.length; i++) {
			iconsArray[i].update();

			// Check collisions with other icons
			for (let j = i + 1; j < iconsArray.length; j++) {
				iconsArray[i].checkCollision(iconsArray[j]);
			}

			iconsArray[i].draw();
		}

		if (window.innerWidth <= 768 && devicePixelRatio !== 1) {
			ctx.restore();
		}

		animationFrameId = requestAnimationFrame(animate);
	}

	function handleResize() {
		if (!canvas) return;

		// Set width and height to ensure proper aspect ratio
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		// On tablet, ensure icons maintain circular shape
		const devicePixelRatio = window.devicePixelRatio || 1;
		if (window.innerWidth <= 768) {
			// Apply scale transformation to maintain correct pixel ratio
			if (ctx) {
				ctx.scale(devicePixelRatio, devicePixelRatio);
			}
		}

		// Reposition icons within new canvas bounds
		iconsArray.forEach((icon) => {
			if (icon.x > canvas.width) icon.x = canvas.width * Math.random();
			if (icon.y > canvas.height) icon.y = canvas.height * Math.random();
		});
	}

	function handleMouseMove(e: MouseEvent) {
		if (!canvas) return;

		const mouseX = e.x;
		const mouseY = e.y;

		// Repel nearby icons
		iconsArray.forEach((icon) => {
			const dx = icon.x - mouseX;
			const dy = icon.y - mouseY;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < 100) {
				const angle = Math.atan2(dy, dx);
				const force = (100 - distance) / 200;
				icon.speedX += Math.cos(angle) * force;
				icon.speedY += Math.sin(angle) * force;
				icon.rotation += force * 0.2;
			}
		});
	}

	// Create a burst effect when icons are released
	export function createBurstEffect() {
		if (!ctx || !canvas) return;

		// Draw a burst at the toggle center
		const burstElements = 12;
		const burstLength = 40;

		for (let i = 0; i < burstElements; i++) {
			const angle = (i / burstElements) * Math.PI * 2;
			const startX = toggleCenter.x;
			const startY = toggleCenter.y;
			const endX = startX + Math.cos(angle) * burstLength;
			const endY = startY + Math.sin(angle) * burstLength;

			// Draw burst line
			ctx.beginPath();
			ctx.moveTo(startX, startY);
			ctx.lineTo(endX, endY);
			ctx.strokeStyle = 'rgba(123, 104, 238, 0.8)';
			ctx.lineWidth = 2;
			ctx.stroke();

			// Animate burst fade-out
			setTimeout(() => {
				if (!ctx) return;

				const fadeSteps = 10;
				let step = 0;

				const fadeInterval = setInterval(() => {
					if (!ctx || step >= fadeSteps) {
						clearInterval(fadeInterval);
						return;
					}

					const opacity = 0.8 - (step / fadeSteps) * 0.8;

					ctx.beginPath();
					ctx.moveTo(startX, startY);
					ctx.lineTo(endX, endY);
					ctx.strokeStyle = `rgba(123, 104, 238, ${opacity})`;
					ctx.lineWidth = 2;
					ctx.stroke();

					step++;
				}, 30);
			}, 100);
		}
	}

	export function startMindfulnessAnimation() {
		// Reset the isSuckedIn state for icons if needed
		iconsArray.forEach((icon) => {
			// Set the target to the toggle button position
			icon.targetX = toggleCenter.x;
			icon.targetY = toggleCenter.y;
		});
	}

	export function endMindfulnessAnimation() {
		// Rather than all icons appearing at once, stagger their appearance
		iconsArray.forEach((icon, index) => {
			if (icon.isSuckedIn) {
				// Set initial state to invisible but positioned at toggle
				icon.x = toggleCenter.x;
				icon.y = toggleCenter.y;
				icon.size = 0; // Start with zero size to grow
				icon.opacity = 0; // Start invisible

				// Delay each icon's appearance for a more natural explosion
				setTimeout(() => {
					// Mark the icon as ready to explode
					icon.readyToExplode = true;
				}, index * 50); // Stagger between each icon
			}
		});
	}

	// Watch for changes in the mindfulness state
	afterUpdate(() => {
		if (prevMindfulnessState !== isMindfulnessActive) {
			if (isMindfulnessActive) {
				startMindfulnessAnimation();
			} else {
				endMindfulnessAnimation();
				createBurstEffect();
			}
			prevMindfulnessState = isMindfulnessActive;
		}
	});

	onMount(() => {
		if (browser) {
			loaded = true;

			// Create icon elements
			const cleanup = createIconElements();

			// Initialize canvas
			if (canvas) {
				ctx = canvas.getContext('2d');
				initIcons();
				animate();

				window.addEventListener('resize', handleResize);
				window.addEventListener('mousemove', handleMouseMove);
			}

			return () => {
				window.removeEventListener('resize', handleResize);
				window.removeEventListener('mousemove', handleMouseMove);
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
				}
				if (cleanup) cleanup();
			};
		}
	});
</script>

<canvas bind:this={canvas} class="distraction-canvas"></canvas>
<div class="hero-overlay"></div>

<style>
	.distraction-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.hero-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: radial-gradient(
			circle at center,
			rgba(15, 12, 41, 0.6) 0%,
			rgba(15, 12, 41, 0.9) 100%
		);
		z-index: 2;
	}

	@media (max-width: 768px) {
		.distraction-canvas {
			height: 100vh;
			object-fit: cover;
		}
	}
</style>
