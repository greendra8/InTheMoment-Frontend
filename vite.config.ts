import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(() => {
	return {
		plugins: [sveltekit()],
		server: {
			host: '0.0.0.0',
			port: 5173 // or any other port you prefer
		},
		define: {
			__APP_ENV__: process.env.VITE_VERCEL_ENV,
		},
	};
});
