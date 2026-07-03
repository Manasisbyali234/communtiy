/* eslint-disable no-console */
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './client';
import { useAuthStore } from '../store/authStore';

let socket: Socket | null = null;
let initPromise: Promise<Socket | null> | null = null;

const getValidToken = (): string | null => {
  return useAuthStore.getState().token ?? null;
};

export const initSocket = async () => {
  if (initPromise) return initPromise;
  initPromise = _initSocket().finally(() => { initPromise = null; });
  return initPromise;
};

const _initSocket = async () => {
  const token = getValidToken();
  if (!token) return null;

  if (socket?.connected) return socket;
  if (socket) { socket.disconnect(); socket = null; }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    reconnectionAttempts: 3,
    reconnectionDelay: 3000,
    timeout: 5000,
  });

  socket.on('connect', () => console.log('Connected to socket server'));
  socket.on('disconnect', (reason) => {
    console.log('Disconnected from socket server:', reason);
  });

  socket.on('connect_error', (err) => {
    if (err.message === 'Unauthorized') {
      // Don't refresh here — the HTTP interceptor handles token refresh.
      // Just update the auth token for the next reconnect attempt.
      const newToken = useAuthStore.getState().token;
      if (newToken) {
        socket!.auth = { token: newToken };
      } else {
        disconnectSocket();
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
