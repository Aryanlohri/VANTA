'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

  let color = '#22c55e'; // Green 80+
  if (score < 60) color = '#ef4444'; // Red < 60
  else if (score < 80) color = '#f59e0b'; // Amber 60-79

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
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
        />
      </svg>
      <span className="text-[11px] font-medium tabular-nums" style={{ color: '#e8e8e8' }}>
        {score}
      </span>
    </div>
  );
}
