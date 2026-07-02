import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, SOCKET_URL } from './client';
import { Community, User, PaginatedResponse, ApiResponse } from '../types';
import { feedKeys } from './feed';
import { useAuthStore } from '../store/authStore';

const toAbsoluteUrl = (url?: string) => {
  if (!url) return '';
  // Already a proxy/backend URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Rewrite direct S3 URLs to go through our backend proxy
    const s3Match = url.match(/https?:\/\/[^/]+\.s3\.[^/]+\.amazonaws\.com\/(.+)/);
    if (s3Match) {
      return `${SOCKET_URL}/api/v1/media/proxy/${encodeURIComponent(s3Match[1])}`;
    }
    // Rewrite localhost URLs so physical devices can reach the server
    return url.replace(/http:\/\/localhost(:\d+)?/, SOCKET_URL.replace(/\/+$/, ''));
  }
  if (url.startsWith('/')) return `${SOCKET_URL}${url}`;
  return url;
};

export const communityKeys = {
  all: ['communities'] as const,
  list: () => [...communityKeys.all, 'list'] as const,
  detail: (id: string) => [...communityKeys.all, 'detail', id] as const,
  members: (id: string) => [...communityKeys.all, 'members', id] as const,
};

// Fetch list of all communities
export function useCommunitiesQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<Community[]>({
    queryKey: communityKeys.list(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PaginatedResponse<Community>>>('/communities');
      return (res.data.data.data ?? []).map((c: any) => ({
        ...c,
        membersCount: c.membersCount ?? c.memberCount ?? 0,
        postsCount: c.postsCount ?? 0,
        avatarUrl: toAbsoluteUrl(c.avatarUrl),
        bannerUrl: toAbsoluteUrl(c.bannerUrl),
        isJoined: c.isJoined ?? false,
      }));
    },
  });
}

// Fetch single community detail by id
export function useCommunityDetailsQuery(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<Community | undefined>({
    queryKey: communityKeys.detail(id),
    enabled: !!id && isAuthenticated,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Community>>(`/communities/${id}`);
      const c = res.data.data;
      return {
        ...c,
        avatarUrl: toAbsoluteUrl(c.avatarUrl),
        bannerUrl: toAbsoluteUrl(c.bannerUrl),
        membersCount: (c as any).membersCount ?? (c as any).memberCount ?? 0,
      };
    },
  });
}

// Join or leave community mutation
export function useJoinCommunityMutation() {
  const queryClient = useQueryClient();
  return useMutation<Community | null, Error, { communityId: string; isJoined: boolean }>({
    mutationFn: async ({ communityId, isJoined }) => {
      try {
        if (isJoined) {
          await apiClient.post(`/communities/${communityId}/leave`);
          return null;
        }
        const res = await apiClient.post<ApiResponse<Community>>(`/communities/${communityId}/join`);
        return res.data.data;
      } catch (e: any) {
        if (e?.response?.status === 409) return null; // already joined/pending — treat as success
        throw e;
      }
    },
    onSuccess: (_data, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: communityKeys.list() });
      queryClient.invalidateQueries({ queryKey: communityKeys.detail(communityId) });
      queryClient.invalidateQueries({ queryKey: feedKeys.posts() });
    },
  });
}

// Fetch community members
export function useCommunityMembersQuery(communityId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<User[]>({
    queryKey: communityKeys.members(communityId),
    enabled: !!communityId && isAuthenticated,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(`/communities/${communityId}/members`);
      return res.data.data.data;
    },
  });
}
