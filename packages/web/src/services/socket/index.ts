import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';

let socket: Socket | null = null;

export function connectSocket(): Socket | null {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (!token) return null;

  if (socket?.connected) return socket;

  const url = import.meta.env.VITE_SOCKET_URL || '';

  socket = io(url || window.location.origin, {
    auth: { token },
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
