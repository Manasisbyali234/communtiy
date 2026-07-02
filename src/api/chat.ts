import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { Message, Notification, PaginatedResponse, ApiResponse, Conversation } from '../types';
import { useEffect } from 'react';
import { getSocket } from './socket';

export const chatKeys = {
  all: ['chats'] as const,
  list: () => [...chatKeys.all, 'list'] as const,
  messages: (chatId: string) => [...chatKeys.all, 'messages', chatId] as const,
};

// Fetch active chat list
export function useChatsQuery() {
  return useQuery<Conversation[]>({
    queryKey: chatKeys.list(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Conversation[]>>('/messages/conversations');
      return res.data.data;
    },
  });
}

// Fetch messages for a specific chat
export function useMessagesQuery(chatId: string) {
  return useQuery<Message[]>(
    {
      queryKey: chatKeys.messages(chatId),
      queryFn: async () => {
        const res = await apiClient.get<ApiResponse<PaginatedResponse<Message>>>(`/messages/conversations/${chatId}`);
        return res.data.data.data;
      },
    }
  );
}

// Send a message
export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation<Message, Error, { chatId: string; content: string }>({
    mutationFn: async ({ chatId, content }) => {
      const res = await apiClient.post<ApiResponse<Message>>(`/messages/conversations/${chatId}`, { content });
      return res.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    },
  });
}

// Start or get conversation with user
export function useStartConversationMutation() {
  const queryClient = useQueryClient();
  return useMutation<Conversation, Error, { participantId: string }>({
    mutationFn: async ({ participantId }) => {
      const res = await apiClient.post<ApiResponse<Conversation>>('/messages/conversations', { participantId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    },
  });
}
export function useNotificationsQuery() {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications');
      return res.data.data.data;
    },
  });
}

export function useUnreadCountQuery() {
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
      return res.data.data.count;
    },
    refetchInterval: 30000,
  });
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.put('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.put(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// Listen to real-time notifications
export function useNotificationSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNew = (notification: Notification) => {
      queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
        if (!old) return [notification];
        if (old.some((n) => n.id === notification.id)) return old;
        return [notification, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };

    socket.on('notification:new', handleNew);
    return () => { socket.off('notification:new', handleNew); };
  }, [queryClient]);
}

// Listen to real-time chat messages
export function useChatSocket(conversationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      // If we are listening to a specific conversation, update its cache
      if (conversationId && message.conversationId === conversationId) {
        queryClient.setQueryData<Message[]>(chatKeys.messages(conversationId), (old) => {
          if (!old) return [message];
          // Check for duplicates
          if (old.some(m => m.id === message.id)) return old;
          return [...old, message];
        });
      }
      
      // Also update the conversation list to bump the lastMessage
      queryClient.setQueryData<Conversation[]>(chatKeys.list(), (old) => {
        if (!old) return old;
        return old.map(conv => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message,
              lastMessageAt: message.createdAt,
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
      });
    };

    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.off('chat:message', handleNewMessage);
    };
  }, [conversationId, queryClient]);
}
