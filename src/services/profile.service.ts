import { supabase } from '../shared/utils/supabase.ts';
import type { Profile, UpdateProfileInput } from '../types/profile.types.ts';

async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export const profileService = {
  getProfile,
  updateProfile,
};
