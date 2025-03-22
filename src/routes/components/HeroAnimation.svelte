<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { browser } from '$app/environment';

	// Add TypeScript interface for FontAwesome
	declare global {
		interface Window {
			FontAwesome: any; // Use any for simplicity as the API is complex
			fontawesome: any; // Lowercase alternative
			FA: any; // Another common alias
		}
	}

	export let isMindfulnessActive = false;
	export let toggleCenter = { x: 0, y: 0 };

	let prevMindfulnessState = false;
	let loaded = false;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;
	let iconsArray: DistractionIcon[] = [];
	let animationFrameId: number;
	let animationPaused = false;
	let observer: IntersectionObserver;

	interface IconType {
		name: string;
		cssClass: string;
		color: string;
	}

	// Font Awesome icons with their classes
	const iconTypes: IconType[] = [
		// Social media
		{ name: 'instagram', cssClass: 'fab fa-instagram', color: '#C13584' },
		{ name: 'facebook', cssClass: 'fab fa-facebook-f', color: '#4267B2' },
		{ name: 'tiktok', cssClass: 'fab fa-tiktok', color: '#EE1D52' },
		{ name: 'twitter', cssClass: 'fab fa-twitter', color: '#1DA1F2' },
		{ name: 'youtube', cssClass: 'fab fa-youtube', color: '#FF0000' },
		{ name: 'snapchat', cssClass: 'fab fa-snapchat-ghost', color: '#FFFC00' },
		{ name: 'whatsapp', cssClass: 'fab fa-whatsapp', color: '#25D366' },
		{ name: 'telegram', cssClass: 'fab fa-telegram-plane', color: '#0088cc' },
		{ name: 'discord', cssClass: 'fab fa-discord', color: '#5865F2' },
		{ name: 'twitch', cssClass: 'fab fa-twitch', color: '#6441A4' },
		{ name: 'reddit', cssClass: 'fab fa-reddit-alien', color: '#FF4500' },
		{ name: 'pinterest', cssClass: 'fab fa-pinterest-p', color: '#E60023' },

		// Notifications & Interactions
		{ name: 'bell', cssClass: 'fas fa-bell', color: '#FFA500' },
		{ name: 'envelope', cssClass: 'fas fa-envelope', color: '#4285F4' },
		{ name: 'comment', cssClass: 'fas fa-comment', color: '#34B7F1' },
		{ name: 'heart', cssClass: 'fas fa-heart', color: '#FF6B6B' },
		{ name: 'thumbs-up', cssClass: 'fas fa-thumbs-up', color: '#3B5998' },
		{ name: 'star', cssClass: 'fas fa-star', color: '#FFD700' },
		{ name: 'share', cssClass: 'fas fa-share-alt', color: '#00acee' },

		// Devices
		{ name: 'mobile', cssClass: 'fas fa-mobile-alt', color: '#A0A0A0' },
		{ name: 'laptop', cssClass: 'fas fa-laptop', color: '#808080' },
		{ name: 'desktop', cssClass: 'fas fa-desktop', color: '#696969' },
		{ name: 'tablet', cssClass: 'fas fa-tablet-alt', color: '#909090' },
		{ name: 'headphones', cssClass: 'fas fa-headphones', color: '#555555' },
		{ name: 'tv', cssClass: 'fas fa-tv', color: '#444444' },

		// Misc digital elements
		{ name: 'hashtag', cssClass: 'fas fa-hashtag', color: '#1DA1F2' },
		{ name: 'at', cssClass: 'fas fa-at', color: '#1877f2' },
		{ name: 'camera', cssClass: 'fas fa-camera', color: '#E1306C' },
		{ name: 'wifi', cssClass: 'fas fa-wifi', color: '#4CAF50' }
	];

	class DistractionIcon {
		x: number;
		y: number;
		size: number;
		speedX: number;
		speedY: number;
		rotation: number;
		rotationSpeed: number;
		icon: IconType;
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
		iconSvg: SVGElement | null;
		iconImage: HTMLImageElement | null; // Store the icon image for reuse

		constructor() {
			this.x = Math.random() * window.innerWidth;
			this.y = Math.random() * window.innerHeight;
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
			this.iconSvg = null;
			this.iconImage = null;

			// Try to get the Font Awesome icon and prepare it
			this.initializeIcon();
		}

		// Initialize the icon using Font Awesome's JS API
		initializeIcon() {
			if (!browser) return;

			// Try to find FontAwesome global object under different possible names
			const fa = window.FontAwesome || window.fontawesome || window.FA;
			if (!fa) return;

			try {
				const iconParts = this.icon.cssClass.split(' ');
				const iconStyle = iconParts[0]; // 'fas' or 'fab'
				const iconName = iconParts[1].substring(3); // remove 'fa-' prefix

				// Try different potential API structures
				let iconDefinition;
				let iconNode;

				// Try the main findIconDefinition API
				if (typeof fa.findIconDefinition === 'function') {
					iconDefinition = fa.findIconDefinition({
						prefix: iconStyle === 'fas' ? 'fas' : 'fab',
						iconName: iconName
					});

					if (iconDefinition && typeof fa.icon === 'function') {
						const result = fa.icon(iconDefinition);
						iconNode = result && result.node && result.node[0];
					}
				}
				// Try accessing via fontawesome.library
				else if (fa.library) {
					// Different potential API structures
					const prefix = iconStyle === 'fas' ? 'fas' : 'fab';
					const library = fa.library || fa.dom;

					if (library && library.icon) {
						const result = library.icon(`${prefix} fa-${iconName}`);
						iconNode = result && result.node && result.node[0];
					}
				}

				if (iconNode) {
					this.iconSvg = iconNode;

					// Set SVG to white color
					const paths = this.iconSvg.querySelectorAll('path');
					paths.forEach((path) => {
						path.setAttribute('fill', 'white');
					});

					// Convert SVG to image once for reuse
					this.convertSvgToImage();
				} else {
					// Fallback to creating SVG for the icon
					this.createFallbackSvg(iconName);
				}
			} catch (e) {
				console.warn(`Couldn't load icon SVG for ${this.icon.cssClass}:`, e);
			}
		}

		// Create a simple SVG representation if FontAwesome API fails
		createFallbackSvg(iconName: string) {
			// Simple SVG with the first letter of the icon
			const letter = this.icon.name.charAt(0).toUpperCase();
			const svgNS = 'http://www.w3.org/2000/svg';

			const svg = document.createElementNS(svgNS, 'svg');
			svg.setAttribute('viewBox', '0 0 32 32');
			svg.setAttribute('width', '32');
			svg.setAttribute('height', '32');

			const text = document.createElementNS(svgNS, 'text');
			text.setAttribute('x', '16');
			text.setAttribute('y', '22');
			text.setAttribute('font-family', 'sans-serif');
			text.setAttribute('font-size', '20');
			text.setAttribute('text-anchor', 'middle');
			text.setAttribute('fill', 'white');
			text.textContent = letter;

			svg.appendChild(text);
			this.iconSvg = svg;
			this.convertSvgToImage();
		}

		// Convert SVG to image for canvas use
		convertSvgToImage() {
			if (!this.iconSvg) return;

			try {
				// Create a data URL from the SVG
				const svgData = new XMLSerializer().serializeToString(this.iconSvg);
				const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
				const url = URL.createObjectURL(svgBlob);

				// Create an image, store it for reuse
				this.iconImage = new Image();
				this.iconImage.onload = () => {
					// Free memory
					URL.revokeObjectURL(url);
				};
				this.iconImage.src = url;
			} catch (e) {
				console.warn("Couldn't convert SVG to image:", e);
			}
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

				// Bounce off edges - use window dimensions instead of canvas for consistency
				if (this.x < this.size || this.x > window.innerWidth - this.size) {
					this.speedX = -this.speedX;
					// Keep within bounds
					if (this.x < this.size) this.x = this.size;
					if (this.x > window.innerWidth - this.size) this.x = window.innerWidth - this.size;
				}

				if (this.y < this.size || this.y > window.innerHeight - this.size) {
					this.speedY = -this.speedY;
					// Keep within bounds
					if (this.y < this.size) this.y = this.size;
					if (this.y > window.innerHeight - this.size) this.y = window.innerHeight - this.size;
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

			// If we have a loaded icon image, draw it
			if (this.iconImage && this.iconImage.complete) {
				const iconSize = this.size * 0.8;
				ctx.drawImage(this.iconImage, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
			} else {
				// Fallback to letter if no image is available
				this.drawLetterFallback(ctx);
			}

			ctx.restore();
		}

		// Separate method for the letter fallback
		drawLetterFallback(ctx: CanvasRenderingContext2D) {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
			ctx.font = `bold ${this.size * 0.7}px sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			// Use first letter of the icon name
			const letter = this.icon.name.charAt(0).toUpperCase();
			ctx.fillText(letter, 0, 0);
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

		// Set correct canvas dimensions accounting for device pixel ratio
		const dpr = window.devicePixelRatio || 1;
		canvas.width = window.innerWidth * dpr;
		canvas.height = window.innerHeight * dpr;

		// Set display size
		canvas.style.width = window.innerWidth + 'px';
		canvas.style.height = window.innerHeight + 'px';

		// Scale the context for the actual device pixel ratio
		if (ctx) {
			ctx.scale(dpr, dpr);
		}

		// Calculate the number of icons based on screen size
		const iconCount = Math.min(35, Math.floor((window.innerWidth * window.innerHeight) / 25000));
		iconsArray = [];

		for (let i = 0; i < iconCount; i++) {
			iconsArray.push(new DistractionIcon());
		}
	}

	function animate() {
		if (!ctx || !canvas || animationPaused) return;

		// Get device pixel ratio for proper scaling
		const dpr = window.devicePixelRatio || 1;

		// Clear the entire canvas with device pixel ratio considered
		ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

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

		animationFrameId = requestAnimationFrame(animate);
	}

	// Function to start the animation if it's paused
	function startAnimation() {
		if (animationPaused) {
			animationPaused = false;
			animationFrameId = requestAnimationFrame(animate);
		}
	}

	// Function to pause the animation
	function pauseAnimation() {
		if (!animationPaused) {
			animationPaused = true;
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		}
	}

	// Setup IntersectionObserver to track visibility
	function setupVisibilityObserver() {
		if (!canvas || !browser) return;

		// Create observer that triggers when less than 20% is visible
		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
						startAnimation();
					} else {
						pauseAnimation();
					}
				});
			},
			{
				threshold: [0, 0.1, 0.2, 0.3] // Check at these visibility thresholds
			}
		);

		// Start observing the canvas
		observer.observe(canvas);
	}

	function handleResize() {
		if (!canvas) return;

		// Set correct canvas dimensions for device pixel ratio
		const dpr = window.devicePixelRatio || 1;
		canvas.width = window.innerWidth * dpr;
		canvas.height = window.innerHeight * dpr;

		// Set display size
		canvas.style.width = window.innerWidth + 'px';
		canvas.style.height = window.innerHeight + 'px';

		// Reset and apply the correct scale
		if (ctx) {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.scale(dpr, dpr);
		}

		// Reposition icons within new canvas bounds - ensure they're distributed across the entire canvas
		iconsArray.forEach((icon) => {
			// If icons are outside the canvas, reposition them inside
			if (icon.x > window.innerWidth) icon.x = window.innerWidth * Math.random();
			if (icon.y > window.innerHeight) icon.y = window.innerHeight * Math.random();
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

	function loadFontAwesome() {
		// Ensure Font Awesome is loaded before drawing
		return new Promise<void>((resolve) => {
			if (document.querySelector('link[href*="fontawesome"]')) {
				// Font Awesome is already loaded
				resolve();
				return;
			}

			const link = document.createElement('link');
			link.href = '/fontawesome/css/all.css';
			link.rel = 'stylesheet';
			link.onload = () => resolve();
			document.head.appendChild(link);

			// Fallback timeout to resolve even if onload doesn't trigger
			setTimeout(resolve, 1000);
		});
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
			loadFontAwesome().then(() => {
				if (canvas) {
					ctx = canvas.getContext('2d');

					// Set initial canvas dimensions
					canvas.width = window.innerWidth;
					canvas.height = window.innerHeight;

					initIcons();
					animate();
					setupVisibilityObserver();

					window.addEventListener('resize', handleResize);
					window.addEventListener('mousemove', handleMouseMove);

					// Handle orientation changes specifically
					window.addEventListener('orientationchange', () => {
						// Small delay to allow the browser to complete the orientation change
						setTimeout(handleResize, 100);
					});

					// Also pause when tab is not visible to save resources
					document.addEventListener('visibilitychange', () => {
						if (document.hidden) {
							pauseAnimation();
						} else {
							startAnimation();
						}
					});
				}
			});

			return () => {
				window.removeEventListener('resize', handleResize);
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('orientationchange', handleResize);
				document.removeEventListener('visibilitychange', () => {});
				if (observer) {
					observer.disconnect();
				}
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
				}
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
