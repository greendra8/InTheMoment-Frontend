import { supabase } from '$lib/supabaseClient';

export async function updateUserProfile(userId: string, data: { preferences: Record<string, string>, complete: boolean }) {
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return updatedProfile;
}