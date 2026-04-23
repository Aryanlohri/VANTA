import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { createLogger, WS_EVENTS } from '@aicr/shared';

const logger = createLogger('review-service:websocket');

export function initWebSocket(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // JWT auth middleware for WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const secret = process.env.JWT_SECRET || 'dev-jwt-secret-not-for-production';
      const payload = jwt.verify(token as string, secret, {
        issuer: 'aicr-auth-service',
        audience: 'aicr-platform',
      }) as any;
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info({ userId: (socket as any).userId }, 'Client connected');

    socket.on(WS_EVENTS.JOIN_REVIEW, (reviewId: string) => {
      socket.join(`review:${reviewId}`);
      logger.debug({ reviewId }, 'Client joined review room');
    });

    socket.on(WS_EVENTS.LEAVE_REVIEW, (reviewId: string) => {
      socket.leave(`review:${reviewId}`);
    });

    socket.on('disconnect', () => {
      logger.debug({ userId: (socket as any).userId }, 'Client disconnected');
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}
