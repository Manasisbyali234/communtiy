import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from './client';
import { Event, ApiResponse, PaginatedResponse } from '../types';
import { useEventStore } from '../store/eventStore';

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
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<PaginatedResponse<Event>>>('/events');
        const data = res.data.data.data;
        return data ?? [];
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
  const addLocalEvent = useEventStore((s) => s.addEvent);
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
      return res.data.data;
    },
    onSuccess: (newEvent) => {
      addLocalEvent(newEvent);
      queryClient.invalidateQueries({ queryKey: eventKeys.list() });
    },
    onError: (_err, variables) => {
      // Backend failed — create a local-only event so it still shows in the UI
      const localEvent: Event = {
        id: `local-${Date.now()}`,
        title: variables.title,
        description: variables.description,
        location: variables.location,
        startsAt: variables.startsAt,
        endsAt: variables.endsAt,
        coverUrl: variables.coverUrl,
        rsvpCount: 0,
        creatorId: 'local',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addLocalEvent(localEvent);
    },
  });
}
