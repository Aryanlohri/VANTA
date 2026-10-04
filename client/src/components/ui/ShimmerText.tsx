'use client';

import { ReactNode, useEffect, useRef, useState, ElementType } from 'react';
import { cn } from '@/lib/utils';

interface ShimmerTextProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delay?: number;
}

export function ShimmerText({ 
  children, 
  className, 
  as: Component = 'span', 
  delay = 400 
}: ShimmerTextProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Initial delay logic for the first load
    const timer = setTimeout(() => {
      initialized.current = true;
      setIsAnimating(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!initialized.current) return;

    // IntersectionObserver to pause when off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsAnimating(entry.isIntersecting && document.visibilityState === 'visible');
      },
      { threshold: 0 }
    );

    const handleVisibilityChange = () => {
      if (elementRef.current) {
        setIsAnimating(
          document.visibilityState === 'visible' && 
          elementRef.current.getBoundingClientRect().top < window.innerHeight
        );
      }
    };

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <Component
      ref={elementRef}
      className={cn("shimmer-text", className)}
      style={{
        animationPlayState: isAnimating ? 'running' : 'paused'
      }}
    >
      {children}
    </Component>
  );
}
