import type { PageServerLoad } from './$types';
import sleep from '$lib/assets/3d.webp';
import breath from '$lib/assets/3d2.webp';
import walk from '$lib/assets/3d3.webp';
import commute from '$lib/assets/3d4.webp';
import focus from '$lib/assets/3d5.webp';
import square from '$lib/assets/square.webp';

interface Meditation {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  backgroundImage: string;
  isFeatured: boolean;
}

function createMeditations(): Meditation[] {
  const meditations = [
    { id: '1', title: 'Mindful Walking', subtitle: 'Experience the outdoors', icon: 'fa-solid fa-walking', backgroundImage: walk, isFeatured: false },
    { id: '2', title: 'Mindful Breathing', subtitle: 'Remember to inhale and exhale', icon: 'fa-solid fa-wind', backgroundImage: breath, isFeatured: false },
    { id: '3', title: 'Mindful Focus', subtitle: 'Relax your mind', icon: 'fa-solid fa-brain', backgroundImage: focus, isFeatured: false },
    { id: '4', title: 'Mindful Commuting', subtitle: 'Find peace in the mundane', icon: 'fa-solid fa-train', backgroundImage: commute, isFeatured: false },
    { id: '5', title: 'Mindful Sleep', subtitle: 'Guided meditations for sleep', icon: 'fa-solid fa-bed', backgroundImage: sleep, isFeatured: false },
  ];

  const randomIndex = Math.floor(Math.random() * meditations.length);
  meditations[randomIndex].isFeatured = true;

  return meditations;
}

export const load: PageServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();

  if (!session) {
    return {
      status: 302,
      redirect: '/login'
    };
  }

  const meditations = createMeditations();
  const featuredMeditation = meditations.find(m => m.isFeatured);

  return {
    meditations,
    featuredMeditation,
    user: session.user,
    square
  };
};