const fs = require('fs');

// 1. Update globals.css with motion tokens and stronger shimmer
let css = fs.readFileSync('client/src/app/globals.css', 'utf8');

const motionTokens = `
  /* Motion Tokens */
  --motion-duration-instant: 100ms;
  --motion-duration-fast: 150ms;
  --motion-duration-base: 200ms;
  --motion-duration-slow: 300ms;
  --motion-ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Shimmer Tokens (Brightened) */
  --shimmer-dark: #616161;
  --shimmer-mid: #b4b4b4;
  --shimmer-peak: #ffffff;
`;

if (!css.includes('--motion-duration-instant')) {
  css = css.replace(':root {', ':root {\n' + motionTokens);
}

css = css.replace(
  'background-image: linear-gradient(100deg, #7d7d7d, #b4b4b4, #e4e4e4, #b4b4b4, #7d7d7d, #7d7d7d, #b4b4b4, #e4e4e4, #b4b4b4, #7d7d7d);',
  'background-image: linear-gradient(100deg, var(--shimmer-dark), var(--shimmer-mid), var(--shimmer-peak), var(--shimmer-mid), var(--shimmer-dark), var(--shimmer-dark), var(--shimmer-mid), var(--shimmer-peak), var(--shimmer-mid), var(--shimmer-dark));'
);

const reducedMotion = `
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;
if (!css.includes('prefers-reduced-motion: reduce')) {
  css = css + '\n' + reducedMotion;
}
fs.writeFileSync('client/src/app/globals.css', css);

// 2. Create motion wrapper
const motionTs = `
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
`;
fs.writeFileSync('client/src/lib/motion.ts', motionTs);

// 3. Make Shimmer consistent across page headers
let header = fs.readFileSync('client/src/components/ui/PageHeader.tsx', 'utf8');
if (!header.includes('ShimmerText')) {
  header = header.replace(
    "import { ChevronLeft } from 'lucide-react';",
    "import { ChevronLeft } from 'lucide-react';\nimport { ShimmerText } from './ShimmerText';"
  );
  
  header = header.replace(
    '<h1 className="text-[17px] font-bold tracking-wide uppercase text-[#e8e8e8]">',
    '<h1 className="text-[17px] font-bold tracking-wide uppercase text-[#e8e8e8]">\n          <ShimmerText>'
  ).replace(
    '{title}\n        </h1>',
    '{title}\n          </ShimmerText>\n        </h1>'
  );
  fs.writeFileSync('client/src/components/ui/PageHeader.tsx', header);
}
