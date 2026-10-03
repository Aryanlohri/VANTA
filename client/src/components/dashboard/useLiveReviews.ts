'use client';

import { useEffect, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { reviewApi } from '@/lib/api';

// Pseudo-stages based on time since created for processing reviews
export function useReviewProgress(review: any) {
  const [progress, setProgress] = useState({ stage: 'Queued', percent: 0 });

  useEffect(() => {
    if (review.status !== 'processing' && review.status !== 'pending') return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(review.created_at).getTime();
      
      let stage = 'Queued';
      let percent = 10;

      if (elapsed > 10000) {
        stage = 'Scoring';
        percent = 90;
      } else if (elapsed > 5000) {
        stage = 'Analyzing';
        percent = 60;
      } else if (elapsed > 2000) {
        stage = 'Parsing';
        percent = 30;
      }

      setProgress({ stage, percent });
    }, 1000);

    return () => clearInterval(interval);
  }, [review]);

  return progress;
}

export function useLiveReviews(initialReviews: any[]) {
  const [reviews, setReviews] = useState(initialReviews);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    // We only poll if there are processing/pending reviews.
    // In a real app we'd connect socket.io here.
    // TODO: Connect real socket.io once backend implements it for the list view.
    const activeReviews = reviews.some(r => r.status === 'processing' || r.status === 'pending');
    
    if (!activeReviews) return;

    let socket: Socket | null = null;
    let fallbackInterval: ReturnType<typeof setInterval>;

    try {
      socket = io(process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000', {
        path: '/socket.io',
        transports: ['websocket'],
      });

      socket.on('review:updated', (updatedReview: any) => {
        setReviews(prev => prev.map(r => r.id === updatedReview.id ? { ...r, ...updatedReview } : r));
      });

      socket.on('disconnect', () => {
        startPolling();
      });

    } catch (e) {
      startPolling();
    }

    function startPolling() {
      fallbackInterval = setInterval(async () => {
        try {
          const res = await reviewApi.list();
          setReviews(res.data.data);
        } catch (e) {
          // ignore
        }
      }, 5000);
    }

    return () => {
      if (socket) socket.disconnect();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [reviews]);

  return reviews;
}
