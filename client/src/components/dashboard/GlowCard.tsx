'use client';

import { useRef, MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowOpacity?: number;
}

export function GlowCard({ children, className, glowOpacity = 0.08 }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    // Respect prefers-reduced-motion for the dynamic mouse tracking if we want to be strict,
    // but typically hover glows are okay. The prompt said "disable the glow tracking" for reduced motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative group overflow-hidden bg-[#0a0a0a] border border-[var(--color-border)] rounded-xl transition-colors hover:border-[#333333]",
        className
      )}
      style={{
        // Define default CSS vars in case mouse hasn't moved over yet
        '--mouse-x': '50%',
        '--mouse-y': '50%',
      } as React.CSSProperties}
    >
      {/* Dynamic Glow Layer */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,${glowOpacity}) 0%, transparent 50%)`,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
