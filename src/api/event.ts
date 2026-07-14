import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient, API_BASE_URL } from './client';
import { Event, ApiResponse, PaginatedResponse } from '../types';
import { useEventStore } from '../store/eventStore';

const getBase = () => API_BASE_URL.replace('/api/v1', '');
const toAbs = (url?: string): string | undefined => {
  if (!url) return undefined;
  // Direct S3 URL — rewrite to backend proxy so private bucket objects load
  if (url.includes('amazonaws.com')) {
    try {
      const parsed = new URL(url);
      const key = parsed.pathname.replace(/^\//, '');
      return `${getBase()}/api/v1/media/proxy/${encodeURIComponent(key)}`;
    } catch {}
  }
  // Absolute proxy URL with any host (e.g. stale IP) — repoint to current server
  if (url.startsWith('http')) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/api/v1/media/proxy/')) {
        return `${getBase()}${parsed.pathname}${parsed.search}`;
      }
    } catch {}
    return url;
  }
  // Relative proxy path — prepend the server base so Image gets an absolute URL
  if (url.startsWith('/')) return `${getBase()}${url}`;
  return url;
};

const normalizeEvent = (e: any): Event => {
  const coverUrl = toAbs(e.coverUrl);
  console.log('[normalizeEvent] id:', e.id, '| raw coverUrl:', e.coverUrl, '| resolved:', coverUrl);
  return { ...e, coverUrl };
};

export const eventKeys = {
  all: ['events'] as const,
  list: () => [...eventKeys.all, 'list'] as const,
  detail: (id: string) => [...eventKeys.all, 'detail', id] as const,
};

export function useEventsQuery() {
  const localEvents = useEventStore((s) => s.localEvents);
  const removeEvent = useEventStore((s) => s.removeEvent);

  const query = useQuery<Event[]>({
    queryKey: eventKeys.list(),
    staleTime: 30 * 60 * 1000,  // 30 min — prevents unnecessary refetches that can break image URLs
    gcTime: 60 * 60 * 1000,     // 1 hour — keep cached data alive across navigations
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<PaginatedResponse<Event>>>('/events');
        const data = res.data.data.data;
        const normalized = (data ?? []).map(normalizeEvent).filter((e: any) => !e.status || e.status === 'APPROVED');
        console.log('[useEventsQuery] events coverUrls:', normalized.map((e: Event) => ({ id: e.id, coverUrl: e.coverUrl })));
        return normalized;
      } catch {
        return [];
      }
    },
  });

  const serverData = query.data ?? [];
  const serverIds = new Set(serverData.map((e) => e.id));

  // Evict local events once the server confirms them
  useEffect(() => {
    const confirmedIds = new Set(serverData.map((e) => e.id));
    localEvents.forEach((e) => {
      if (confirmedIds.has(e.id)) removeEvent(e.id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt]);

  const newLocals = localEvents.filter((e) => !serverIds.has(e.id));
  const merged = [...newLocals, ...serverData];

  return { ...query, data: merged };
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      location?: string;
      startsAt: string;
      endsAt?: string;
      coverUrl?: string;
    }) => {
      const res = await apiClient.post<ApiResponse<Event>>('/events', payload);
      return normalizeEvent(res.data.data);
    },
    onSuccess: () => {
      // Do NOT add to local store — event is PENDING_APPROVAL and must not show publicly
      queryClient.invalidateQueries({ queryKey: eventKeys.list() });
    },
    onError: () => {
      // Do not create local fallback — pending events must not appear before admin approval
    },
  });
}
