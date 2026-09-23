export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UpdateProfileInput = Partial<
  Pick<Profile, 'full_name' | 'avatar_url'>
>;
