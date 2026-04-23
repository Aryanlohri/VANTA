'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3003';

export function useSocket(reviewId?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('aicr_token');
    if (!token) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    if (reviewId) {
      socket.emit('review:join', reviewId);
    }

    return () => {
      if (reviewId) socket.emit('review:leave', reviewId);
      socket.disconnect();
    };
  }, [reviewId]);

  const onEvent = useCallback((event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
    return () => { socketRef.current?.off(event, callback); };
  }, []);

  return { socket: socketRef, onEvent };
}
