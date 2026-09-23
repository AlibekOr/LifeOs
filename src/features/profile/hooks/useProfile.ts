import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../../../services/profile.service.ts';
import { useAuthStore } from '../../../services/storage/authStore.ts';
import type { UpdateProfileInput } from '../../../types/profile.types.ts';
import { profileKeys } from './profileKeys.ts';

export function useProfile() {
  const userId = useAuthStore(state => state.user?.id);

  return useQuery({
    queryKey: profileKeys.all,
    queryFn: () => profileService.getProfile(userId as string),
    enabled: Boolean(userId),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthStore(state => state.user?.id);

  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      profileService.updateProfile(userId as string, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
