<script lang="ts">
	import Section from './shared/Section.svelte';
	import Button from './shared/Button.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let isVisible = false;
	let section: HTMLElement;

	onMount(() => {
		if (browser && 'IntersectionObserver' in window) {
			const observer = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting) {
						isVisible = true;
						observer.disconnect();
					}
				},
				{ threshold: 0.2 }
			);

			if (section) {
				observer.observe(section);
			}

			return () => {
				if (section) observer.unobserve(section);
			};
		}
	});
</script>

<div bind:this={section}>
	<Section padding="large" dark={true}>
		<div class="mobile-container {isVisible ? 'visible' : ''}">
			<div class="mobile-content">
				<h2>Take Your Practice Anywhere</h2>
				<p class="mobile-description">
					Our native mobile apps for iOS and Android feature offline meditation sessions, progress
					tracking, and notification reminders to stay consistent with your practice.
				</p>

				<div class="app-features">
					<div class="app-feature">
						<div class="feature-badge">
							<i class="fas fa-wifi-slash"></i>
						</div>
						<span>Offline Meditations</span>
					</div>

					<div class="app-feature">
						<div class="feature-badge">
							<i class="fas fa-bell"></i>
						</div>
						<span>Session Reminders</span>
					</div>

					<div class="app-feature">
						<div class="feature-badge">
							<i class="fas fa-bolt"></i>
						</div>
						<span>Quick Sessions</span>
					</div>
				</div>

				<div class="app-platforms">
					<Button variant="outline" href="#download-ios">
						<i class="fab fa-apple"></i>
						<span>iOS App</span>
					</Button>

					<Button variant="outline" href="#download-android">
						<i class="fab fa-android"></i>
						<span>Android App</span>
					</Button>
				</div>

				<div class="coming-soon">
					<span>Coming 2025</span>
				</div>
			</div>

			<div class="mobile-device">
				<div class="device-wrapper">
					<div class="phone-outline">
						<div class="phone-screen">
							<!-- <img src="/images/app-mockup.jpg" alt="In The Moment App" class="app-screenshot" /> -->
						</div>
						<div class="phone-notch"></div>
					</div>
				</div>

				<div class="device-shadow"></div>
			</div>
		</div>
	</Section>
</div>

<style>
	.mobile-container {
		display: flex;
		align-items: center;
		gap: 4rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.mobile-content {
		flex: 1;
		opacity: 0;
		transform: translateX(-30px);
		transition: all 0.8s ease;
	}

	.mobile-device {
		flex: 1;
		display: flex;
		justify-content: center;
		position: relative;
		opacity: 0;
		transform: translateX(30px);
		transition: all 0.8s ease;
		transition-delay: 0.2s;
	}

	.mobile-container.visible .mobile-content,
	.mobile-container.visible .mobile-device {
		opacity: 1;
		transform: translateX(0);
	}

	h2 {
		font-size: clamp(1.8rem, 4vw, 2.5rem);
		margin-bottom: 1.5rem;
		color: white;
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
	}

	.mobile-description {
		font-size: 1.1rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 2.5rem;
		max-width: 600px;
	}

	.app-features {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-bottom: 2.5rem;
	}

	.app-feature {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.feature-badge {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		background: linear-gradient(135deg, rgba(123, 104, 238, 0.3), rgba(147, 112, 219, 0.3));
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 1rem;
	}

	.app-feature span {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.app-platforms {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.app-platforms :global(.button) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.app-platforms :global(.button i) {
		font-size: 1.2rem;
	}

	.coming-soon {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.6);
		font-style: italic;
		margin-top: 1rem;
	}

	.device-wrapper {
		position: relative;
		z-index: 2;
	}

	.phone-outline {
		width: 280px;
		height: 570px;
		background: #1a1a2e;
		border-radius: 36px;
		padding: 10px;
		position: relative;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.phone-screen {
		background: #000;
		border-radius: 26px;
		height: 100%;
		overflow: hidden;
		position: relative;
	}

	.app-screenshot {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top center;
	}

	.phone-notch {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 150px;
		height: 25px;
		background: #1a1a2e;
		border-bottom-left-radius: 14px;
		border-bottom-right-radius: 14px;
		z-index: 10;
	}

	.device-shadow {
		position: absolute;
		bottom: -30px;
		width: 260px;
		height: 40px;
		background: rgba(0, 0, 0, 0.2);
		/* filter: blur(15px); */
		border-radius: 50%;
		z-index: 1;
	}

	@media (max-width: 1024px) {
		.mobile-container {
			flex-direction: column-reverse;
			text-align: center;
			gap: 3rem;
		}

		.mobile-description {
			margin-left: auto;
			margin-right: auto;
		}

		.app-features {
			justify-content: center;
		}

		.app-platforms {
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		.app-features {
			flex-direction: column;
			align-items: center;
		}

		.app-platforms {
			flex-direction: column;
			width: 100%;
		}

		.phone-outline {
			width: 240px;
			height: 490px;
		}
	}
</style>
