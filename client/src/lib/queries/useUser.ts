
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api';

export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      const { data } = await authApi.getProfile();
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
