'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children, className }: { children: ReactNode, className?: string }) {
  const isReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={isReducedMotion ? {} : { opacity: 0, y: 6 }}
      animate={isReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
