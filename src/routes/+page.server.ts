import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone/i.test(userAgent);

    // Preselect the correct image based on device
    const initialImage = isMobile
        ? '/images/hero/mobile.webp'
        : '/images/hero/desktop.webp';

    return {
        initialImage,
        isMobile
    };
}; 