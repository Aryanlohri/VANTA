'use client';

import { m } from 'framer-motion';
import { cn, getScoreBand } from '@/lib/utils';

interface ScoreRingProps {
  score: number | null | undefined;
  size?: number;
  strokeWidth?: number;
}

export function ScoreRing({ score, size = 40, strokeWidth = 2 }: ScoreRingProps) {
  if (score == null) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = score / 100;
  const offset = circumference - percent * circumference;

  const band = getScoreBand(score);

  const isReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background ring (neutral) */}
      <svg className="absolute inset-0 rotate-[-90deg]" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Foreground animated ring */}
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={band.color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={isReducedMotion ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
        />
      </svg>
      <span className="text-[11px] font-medium tabular-nums text-[#e8e8e8]">
        {score}
      </span>
    </div>
  );
}
