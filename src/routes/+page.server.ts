import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request }) => {
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone/i.test(userAgent);

    // Preselect the correct image based on device
    const initialImage = isMobile
        ? 'https://cdn.midjourney.com/b724d127-07c2-4f4b-96cd-4e931475f9a0/0_0.png'
        : 'https://cdn.midjourney.com/7b9b1944-1700-4d3c-afff-82120c73e5aa/0_0.png';

    return {
        initialImage,
        isMobile
    };
}; 