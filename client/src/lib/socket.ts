'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { queryClient } from './queryClient';
import { reviewKeys } from './queries/useReviews';

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

    // Intercept 'progress' events to update query cache
  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;
    
    const throttles = new Map<string, NodeJS.Timeout>();
    
    const handler = (data: any) => {
      const id = data.reviewId;
      if (!id) return;
      if (throttles.has(id)) return;
      
      throttles.set(id, setTimeout(() => {
        throttles.delete(id);
        const detailKey = reviewKeys.detail(id);
        const oldDetail = queryClient.getQueryData(detailKey);
        if (oldDetail) {
          queryClient.setQueryData(detailKey, { ...oldDetail, status: data.stage === 'completed' || data.stage === 'failed' ? data.stage : 'processing', progress: data });
        }
        
        const listKey = reviewKeys.list(1);
        const oldList = queryClient.getQueryData<any[]>(listKey);
        if (oldList) {
          queryClient.setQueryData(listKey, oldList.map(r => r.id === id ? { ...r, status: data.stage === 'completed' || data.stage === 'failed' ? data.stage : 'processing', progress: data } : r));
        }
      }, 150));
    };
    
    socket.on('progress', handler);
    return () => { socket.off('progress', handler); };
  }, []);

  return { socket: socketRef, onEvent };
}



