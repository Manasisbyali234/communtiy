/* eslint-disable no-console */
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './client';
import { refreshAccessToken, getOrRefreshToken } from './client';
import { useAuthStore, waitForHydration } from '../store/authStore';

let socket: Socket | null = null;
let initPromise: Promise<Socket | null> | null = null;

const getValidToken = async (): Promise<string | null> => {
  await waitForHydration();
  await useAuthStore.getState().initSecureTokens();
  const state = useAuthStore.getState();
  console.log('[Socket] token present:', !!state.token, '| refreshToken present:', !!state.refreshToken, '| isAuthenticated:', state.isAuthenticated);
  return state.token ?? null;
};

export const initSocket = async () => {
  if (initPromise) return initPromise;
  initPromise = _initSocket().finally(() => { initPromise = null; });
  return initPromise;
};

const _initSocket = async () => {
  const token = await getValidToken();
  if (!token) return null;

  if (socket?.connected) return socket;
  if (socket) { socket.disconnect(); socket = null; }

  socket = io(SOCKET_URL, {
    auth: (cb) => cb({ token: useAuthStore.getState().token }),
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 10000,
  });

  socket.on('connect', () => console.log('Connected to socket server'));
  socket.on('disconnect', (reason) => {
    console.log('Disconnected from socket server:', reason);
    // If server closed the connection, don't auto-reconnect immediately
    if (reason === 'io server disconnect') {
      socket!.connect();
    }
  });

  socket.on('connect_error', async (err) => {
    if (err.message === 'Unauthorized') {
      try {
        const newToken = await getOrRefreshToken();
        console.log('[Socket] token refreshed successfully');
        socket!.auth = { token: newToken };
        socket!.connect();
      } catch (e) {
        console.error('[Socket] refresh on connect_error failed:', (e as any)?.response?.data ?? (e as Error).message);
        useAuthStore.getState().logout();
      }
    } else {
      console.error('Socket connection error:', err.message);
    }
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
