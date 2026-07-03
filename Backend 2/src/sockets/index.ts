import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { config } from '../config/index';
import { logger } from '../config/logger';
import { socketAuthMiddleware } from './auth.socket';
import { registerChatHandlers } from './chat.socket';
import { registerPresenceHandlers } from './presence.socket';

let io: Server;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGINS.trim() === '*' ? true : config.CORS_ORIGINS.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type'],
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
  });

  // Auth middleware on every connection
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.data['userId'] as string;
    logger.info({ userId, socketId: socket.id }, 'Socket connected');

    // Join personal user room for targeted events (notifications, presence)
    void socket.join(`user:${userId}`);

    // Register domain-specific handlers
    registerChatHandlers(io, socket);
    registerPresenceHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info({ userId, reason }, 'Socket disconnected');
    });

    socket.on('error', (err: Error) => {
      logger.error({ err, userId }, 'Socket error');
    });
  });

  logger.info('Socket.io server initialized');
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io has not been initialized. Call initSocketServer first.');
  return io;
}
