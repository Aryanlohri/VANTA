'use client';

import { useMemo } from 'react';
import { m } from 'framer-motion';

interface SparklineProps {
  data?: number[]; // If undefined, we mock it
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, color = '#e8e8e8', width = 60, height = 20 }: SparklineProps) {
  // TODO: Replace this mock data with real timeseries data from the backend.
  // The backend currently only provides raw counts/averages, not daily arrays.
  const chartData = useMemo(() => {
    if (data && data.length > 0) return data;
    // Generate a simple upward trending stub if no data
    return [3, 4, 3, 5, 4, 7, 6, 8, 9, 10];
  }, [data]);

  const path = useMemo(() => {
    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min || 1;
    const stepX = width / (chartData.length - 1);

    return chartData.map((val, i) => {
      const x = i * stepX;
      const y = height - ((val - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [chartData, width, height]);

  const lastPoint = useMemo(() => {
    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min || 1;
    const val = chartData[chartData.length - 1];
    return {
      x: width,
      y: height - ((val - min) / range) * height
    };
  }, [chartData, width, height]);

  const isReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Grayscale line */}
      <m.path
        d={path}
        fill="none"
        stroke="#494949"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={isReducedMotion ? {} : { pathLength: 0, opacity: 0 }}
        animate={isReducedMotion ? {} : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
      />
      {/* Final dot in accent color */}
      <m.circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="2"
        fill={color}
        initial={isReducedMotion ? {} : { scale: 0, opacity: 0 }}
        animate={isReducedMotion ? {} : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: isReducedMotion ? 0 : 1.2 }}
      />
    </svg>
  );
}
