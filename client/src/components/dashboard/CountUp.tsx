'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
}

export function CountUp({ value, duration = 0.6, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  // Optional: respect reduced motion
  const isReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  
  const springValue = useSpring(motionValue, {
    duration: isReducedMotion ? 0 : duration * 1000,
    bounce: 0, // "No bounce on data"
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat('en-US').format(Math.round(latest));
      }
    });
  }, [springValue]);

  return (
    <span ref={ref} className={className}>
      {isReducedMotion ? value : 0}
    </span>
  );
}
