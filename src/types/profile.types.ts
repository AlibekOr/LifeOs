export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  // When the user's working day starts, "HH:MM:SS".
  work_start_time: string;
  created_at: string;
  updated_at: string;
};

export type UpdateProfileInput = Partial<
  Pick<Profile, 'full_name' | 'avatar_url' | 'work_start_time'>
>;
