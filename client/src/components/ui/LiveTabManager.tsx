'use client';
import { useEffect, useRef } from 'react';
import { reviewApi } from '@/lib/api';

export function LiveTabManager({ hasActiveReviews, hasCompletedReview }: { hasActiveReviews: boolean, hasCompletedReview: boolean }) {
  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : 'VANTA');
  
  useEffect(() => {
    if (!hasActiveReviews && !hasCompletedReview) {
      document.title = originalTitle.current;
      changeFavicon('/favicon.ico');
      return;
    }

    if (hasActiveReviews) {
      document.title = 'Reviewing... · VANTA';
      changeFavicon(createCanvasFavicon('active'));
    } else if (hasCompletedReview) {
      document.title = 'Review complete · VANTA';
      changeFavicon(createCanvasFavicon('complete'));
      const t = setTimeout(() => {
        document.title = originalTitle.current;
        changeFavicon('/favicon.ico');
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [hasActiveReviews, hasCompletedReview]);

  return null;
}

function changeFavicon(src: string) {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = src;
}

function createCanvasFavicon(state: 'active' | 'complete'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '/favicon.ico';

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 32, 32);

  if (state === 'active') {
    // Just a simple metallic V
    ctx.strokeStyle = '#b4b4b4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(16, 24);
    ctx.lineTo(24, 8);
    ctx.stroke();
    // pulsing dot
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(16, 28, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Checkmark
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, 16);
    ctx.lineTo(14, 22);
    ctx.lineTo(24, 10);
    ctx.stroke();
  }
  return canvas.toDataURL();
}
