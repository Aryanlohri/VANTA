'use client';

import Link from 'next/link';
import { GlowCard } from './GlowCard';
import { ScoreRing } from './ScoreRing';
import { Clock, Trash2, RotateCcw } from 'lucide-react';
import { cn, getReviewTitleFallback } from '@/lib/utils';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f5a623',
  processing: '#3b82f6',
  completed: '#22c55e',
  failed: '#ef4444'
};

interface ReviewRowProps {
  review: any;
  allReviews?: any[];
  showDelete?: boolean;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
  density?: 'compact' | 'normal';
}

export function ReviewRow({ review, allReviews = [], showDelete = false, onDelete, onRetry, density = 'normal' }: ReviewRowProps) {
  const isFailed = review.status === 'failed';
  const displayTitle = getReviewTitleFallback(review, allReviews);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <GlowCard className={cn(
      isFailed ? "border-l-2 border-l-[#ef4444]/50" : "",
      "group relative"
    )}>
      <div className={cn("flex items-center gap-4", density === 'compact' ? 'p-3' : 'p-4')}>
        {review.status === 'completed' && typeof review.overall_score === 'number' ? (
          <ScoreRing score={review.overall_score} size={density === 'compact' ? 32 : 36} strokeWidth={2.5} />
        ) : (
          <div className={cn("rounded-full flex items-center justify-center shrink-0 border border-[var(--color-border)] relative", density === 'compact' ? "w-8 h-8" : "w-9 h-9")}>
            <div className={cn("w-2 h-2 rounded-full shrink-0", review.status === 'processing' ? 'animate-pulse' : '')} style={{ background: STATUS_COLORS[review.status] || '#888' }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <Link href={`/dashboard/reviews/${review.id}`} className="hover:underline">
            <p className={cn("font-medium truncate text-[#e8e8e8]", density === 'compact' ? "text-xs" : "text-sm")}>{displayTitle}</p>
          </Link>
          <div className="flex items-center gap-2 text-[11px] text-[#616161] mt-1 group-hover:text-[#898989] transition-colors">
            <Clock size={10} />
            <span className="relative cursor-help" title={new Date(review.created_at).toLocaleString()}>
              {/* Note: we should use timeAgo here ideally, but for now we fallback to standard date. */}
              {new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            
            {review.commit_sha && (
              <>
                <span>•</span>
                <span className="font-mono">{review.commit_sha.substring(0, 7)}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Pill or Failed Reason */}
          {isFailed ? (
            <div className="group/fail relative flex items-center">
              <span className="text-[11px] px-2 py-0.5 rounded-full capitalize bg-[#ef4444]/10 text-[#ef4444] cursor-help border border-[#ef4444]/20">
                {review.status}
              </span>
              <div className="absolute right-full mr-2 px-2 py-1 bg-[#0a0a0a] border border-[var(--color-border)] rounded text-[10px] text-white opacity-0 group-hover/fail:opacity-100 pointer-events-none whitespace-nowrap shadow-xl z-50">
                {review.error_message || 'Internal analysis error'}
              </div>
            </div>
          ) : (
            <span className="text-[10px] font-medium tracking-widest uppercase text-[#616161] border border-transparent">
              {review.status}
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isFailed && (
              <button 
                onClick={() => onRetry?.(review.id)}
                className="text-[11px] font-medium tracking-wider uppercase px-2.5 py-1 rounded border border-[var(--color-border)] text-[#898989] hover:text-[#e8e8e8] hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                aria-label="Retry review"
              >
                <RotateCcw size={12} />
                Retry
              </button>
            )}

            {showDelete && (
              <div className="relative flex items-center">
                {!showConfirmDelete ? (
                  <button 
                    onClick={() => setShowConfirmDelete(true)}
                    className="p-1.5 text-[#616161] hover:text-[#ef4444] rounded transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete review"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[var(--color-border)] p-1 rounded shadow-xl">
                    <span className="text-[10px] text-[#e8e8e8] px-1 whitespace-nowrap">Delete this review?</span>
                    <button 
                      onClick={() => onDelete?.(review.id)}
                      className="text-[10px] bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 px-2 py-0.5 rounded transition-colors"
                    >
                      Yes
                    </button>
                    <button 
                      onClick={() => setShowConfirmDelete(false)}
                      className="text-[10px] text-[#898989] hover:text-[#e8e8e8] px-2 py-0.5 rounded transition-colors"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </GlowCard>
  );
}
