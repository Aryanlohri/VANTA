'use client';

import Link from 'next/link';
import { m, AnimatePresence } from 'framer-motion';
import { VantaMark } from './VantaMark';

interface VantaLogoProps {
  collapsed: boolean;
  className?: string;
}

export function VantaLogo({ collapsed, className = '' }: VantaLogoProps) {
  // We use slightly faster opacity finish (0.3s) compared to width (0.45s) as requested.
  // We can orchestrate this inside the variant.
  
  return (
    <Link 
      href="/dashboard" 
      aria-label="VANTA home" 
      className={`flex items-center shrink-0 ${className}`}
    >
      <div className="w-[64px] flex items-center justify-center shrink-0 relative z-20">
        <VantaMark size={20} />
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <m.span
            initial={{ maxWidth: 0, opacity: 0 }}
            animate={{ 
              maxWidth: 120, 
              opacity: 1, 
              transition: {
                maxWidth: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.3, ease: 'easeOut' }
              }
            }}
            exit={{ 
              maxWidth: 0, 
              opacity: 0, 
              transition: {
                maxWidth: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.2, ease: 'easeIn' }
              }
            }}
            // Adjusted text size and padding to perfectly align baselines with the 20px SVG
            className="overflow-hidden whitespace-nowrap text-[#e8e8e8] tracking-[0.38em] uppercase font-medium text-[17px] leading-none pt-[3px] -ml-[16px] relative z-10"
            aria-hidden={collapsed}
          >
            ANTA
          </m.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
