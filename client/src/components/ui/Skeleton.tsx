'use client';
import { cn } from '@/lib/utils';
export function Skeleton({ className, delay = true }: { className?: string; delay?: boolean }) {
  return (
    <div 
      className={cn("bg-white/5 rounded-xl animate-pulse", className)} 
      style={{ animationDelay: delay ? '150ms' : '0ms' }}
    />
  );
}