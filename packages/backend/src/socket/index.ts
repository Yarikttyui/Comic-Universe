import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

interface AuthSocket extends Socket {
  userId?: string;
  email?: string;
}

export function setupSocketHandlers(io: Server) {
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        email: string;
      };

      socket.userId = decoded.userId;
      socket.email = decoded.email;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('progress:update', (data) => {
      socket.to(`user:${socket.userId}`).emit('progress:sync', data);
    });

    socket.on('reading:start', (data) => {
      socket.to(`user:${socket.userId}`).emit('reading:started', data);
    });

    socket.on('choice:made', (data) => {
      socket.to(`user:${socket.userId}`).emit('choice:synced', data);
    });

    socket.on('ending:reached', (data) => {
      socket.to(`user:${socket.userId}`).emit('ending:unlocked', data);
    });

    socket.on('achievement:unlock', (data) => {
      socket.to(`user:${socket.userId}`).emit('achievement:unlocked', data);
    });

    socket.on('comic:join', (comicId: string) => {
      socket.join(`comic:${comicId}`);
    });

    socket.on('comic:leave', (comicId: string) => {
      socket.leave(`comic:${comicId}`);
    });

    socket.on('disconnect', () => {
    });
  });

}
