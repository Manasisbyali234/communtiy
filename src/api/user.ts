import { useQuery } from '@tanstack/react-query';
import { apiClient, API_BASE_URL } from './client';
import { User, ApiResponse } from '../types';
import { useAuthStore } from '../store/authStore';

const BASE = API_BASE_URL.replace('/api/v1', '');
const toAbs = (url?: string) =>
  url && url.startsWith('/') ? `${BASE}${url}` : url;

export const userKeys = {
  all: ['users'] as const,
  suggested: () => [...userKeys.all, 'suggested'] as const,
  search: (query: string) => [...userKeys.all, 'search', query] as const,
};

export function useSuggestedUsersQuery(limit: number = 20) {
  return useQuery<User[]>({
    queryKey: userKeys.suggested(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<User[]>>(`/explore/suggested-users?limit=${limit}`);
      return (res.data.data ?? []).map((u: any) => ({
        ...u,
        avatarUrl: toAbs(u.avatarUrl) ?? u.avatarUrl,
        bannerUrl: toAbs(u.bannerUrl) ?? u.bannerUrl,
        followersCount: u.followersCount ?? u._count?.followers ?? 0,
        bio: u.bio ?? '',
        role: u.role ?? undefined,
      }));
    },
  });
}

export function useSearchUsersQuery(query: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<User[]>({
    queryKey: userKeys.search(query),
    queryFn: async () => {
      if (!query) return [];
      const res = await apiClient.get<ApiResponse<User[]>>(`/search/users?q=${encodeURIComponent(query)}`);
      return res.data.data;
    },
    enabled: query.length > 0 && isAuthenticated,
  });
}
