
'use client';
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

export const motionTokens = {
  duration: {
    instant: 0.1,
    fast: 0.15,
    base: 0.2,
    slow: 0.3,
  },
  ease: {
    out: [0.4, 0, 0.2, 1],
    inOut: [0.4, 0, 0.2, 1],
  },
  stagger: 0.05,
};

export function useReducedMotion() {
  const shouldReduce = useFramerReducedMotion();
  return shouldReduce ?? false;
}

export function getTransition(type: 'base' | 'fast' | 'slow' | 'instant' = 'base') {
  return {
    duration: motionTokens.duration[type],
    ease: motionTokens.ease.out,
  };
}
