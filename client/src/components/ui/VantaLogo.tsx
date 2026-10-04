'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
      <div className="w-[64px] flex items-center justify-center shrink-0">
        <VantaMark size={28} />
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
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
            className="overflow-hidden whitespace-nowrap text-[#e8e8e8] tracking-[0.38em] uppercase font-medium text-lg leading-none pt-[2px]"
            aria-hidden={collapsed}
          >
            ANTA
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
