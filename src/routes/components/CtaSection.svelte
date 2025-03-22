<script lang="ts">
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
				{ threshold: 0.3 }
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

<section class="cta-section" bind:this={section}>
	<div class="cta-bg"></div>
	<div class="cta-content {isVisible ? 'visible' : ''}">
		<h2>Begin Your Mindfulness Journey Today</h2>
		<p>Join thousands of people who have transformed their lives with In The Moment</p>

		<div class="cta-actions">
			<Button href="/register" variant="primary" size="large">Start Free Trial</Button>
			<span class="cta-note">No credit card required. 14-day free trial.</span>
		</div>

		<div class="testimonials">
			<div class="testimonial">
				<div class="testimonial-avatar">JD</div>
				<div class="testimonial-quote">
					"I've tried many meditation apps, but this one adapts to me unlike any other."
				</div>
				<div class="testimonial-author">– Jamie D.</div>
			</div>

			<div class="testimonial">
				<div class="testimonial-avatar">KT</div>
				<div class="testimonial-quote">
					"The personalized approach helped me establish a consistent practice."
				</div>
				<div class="testimonial-author">– Kiran T.</div>
			</div>
		</div>
	</div>
</section>

<style>
	.cta-section {
		position: relative;
		padding: 6rem 2rem;
		overflow: hidden;
		background: linear-gradient(135deg, rgba(60, 50, 120, 0.95) 0%, rgba(100, 80, 180, 0.9) 100%);
	}

	.cta-bg {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
		z-index: 1;
		opacity: 0.5;
	}

	.cta-content {
		position: relative;
		z-index: 2;
		max-width: 900px;
		margin: 0 auto;
		text-align: center;
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.6s ease;
	}

	.cta-content.visible {
		opacity: 1;
		transform: translateY(0);
	}

	h2 {
		font-size: clamp(2rem, 5vw, 3rem);
		color: white;
		margin-bottom: 1.5rem;
		font-family: 'Poppins', sans-serif;
		font-weight: 600;
		line-height: 1.2;
	}

	p {
		font-size: clamp(1.1rem, 2vw, 1.3rem);
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 2.5rem;
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
		line-height: 1.6;
	}

	.cta-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-bottom: 3rem;
	}

	.cta-note {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9rem;
	}

	.testimonials {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 2rem;
		margin-top: 3rem;
	}

	.testimonial {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 1.5rem;
		max-width: 350px;
		text-align: left;
		position: relative;
		backdrop-filter: blur(5px);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.testimonial-avatar {
		position: absolute;
		top: -20px;
		left: 20px;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #7b68ee, #9370db);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 0.8rem;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
	}

	.testimonial-quote {
		color: white;
		font-size: 1rem;
		line-height: 1.6;
		margin-bottom: 0.8rem;
		font-style: italic;
	}

	.testimonial-author {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9rem;
		text-align: right;
	}

	@media (max-width: 768px) {
		.cta-section {
			padding: 4rem 1.5rem;
		}

		.testimonials {
			flex-direction: column;
			align-items: center;
		}

		.testimonial {
			width: 100%;
		}
	}
</style>
