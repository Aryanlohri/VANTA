import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ScoreBand = 'green' | 'amber' | 'red' | 'neutral';

export function getScoreBand(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return {
      band: 'neutral' as ScoreBand,
      color: '#616161',
      bgClass: 'bg-white/5',
      textClass: 'text-[#616161]',
      borderClass: 'border-[var(--color-border)]',
      label: 'Unknown'
    };
  }
  if (score >= 80) {
    return {
      band: 'green' as ScoreBand,
      color: '#22c55e',
      bgClass: 'bg-[#22c55e]/10',
      textClass: 'text-[#22c55e]',
      borderClass: 'border-[#22c55e]/20',
      label: 'Good'
    };
  }
  if (score >= 60) {
    return {
      band: 'amber' as ScoreBand,
      color: '#f59e0b',
      bgClass: 'bg-[#f59e0b]/10',
      textClass: 'text-[#f59e0b]',
      borderClass: 'border-[#f59e0b]/20',
      label: 'Fair'
    };
  }
  return {
    band: 'red' as ScoreBand,
    color: '#ef4444',
    bgClass: 'bg-[#ef4444]/10',
    textClass: 'text-[#ef4444]',
    borderClass: 'border-[#ef4444]/20',
    label: 'Poor'
  };
}

export function getReviewTitleFallback(
  review: { title?: string, repository?: { name: string } | string, repo_name?: string, commit_sha?: string, created_at?: string },
  allReviews?: any[]
): string {
  const isNumeric = /^\d+$/.test(review.title || '');
  if (!review.title || isNumeric) {
    const repoName = typeof review.repository === 'string' ? review.repository : review.repository?.name || review.repo_name || 'Unknown Repo';
    const dateObj = review.created_at ? new Date(review.created_at) : new Date();
    
    // Check for collisions
    const fallbackBase = `${repoName} · ${dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    
    // We append the short sha or time if needed, but for simplicity, let's just append the short SHA if available, otherwise time.
    if (review.commit_sha) {
      return `${fallbackBase} (${review.commit_sha.substring(0, 7)})`;
    }
    return `${fallbackBase} ${dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  }
  return review.title;
}



// --- Date & Number Helpers ---
export function formatRelativeTime(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}

export function formatAbsoluteTime(dateString: string | Date): string {
  return new Date(dateString).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

// --- Greeting Summary ---
export interface GreetingStats {
  failedThisWeek: number;
  inProgress: number;
  scoreTrend: number;
  totalThisMonth: number;
  isFirstRun: boolean;
}

export function buildGreetingSummary(stats: GreetingStats): string {
  if (stats.isFirstRun) return 'Welcome to VANTA. Connect a repository to start your first review.';
  
  const facts: string[] = [];
  
  if (stats.failedThisWeek > 0) facts.push(`${stats.failedThisWeek} review${stats.failedThisWeek > 1 ? 's' : ''} failed this week`);
  else if (stats.inProgress > 0) facts.push(`${stats.inProgress} review${stats.inProgress > 1 ? 's' : ''} in progress`);
  
  if (stats.scoreTrend !== 0) {
    const dir = stats.scoreTrend > 0 ? 'up' : 'down';
    facts.push(`average score ${dir} ${Math.abs(stats.scoreTrend).toFixed(1)} this month`);
  }
  
  if (facts.length < 2 && stats.totalThisMonth > 0) {
    facts.push(`${formatCompactNumber(stats.totalThisMonth)} reviews this month`);
  }
  
  if (facts.length === 0) return 'All systems normal · ready for review.';
  
  return facts.slice(0, 2).join(' · ');
}
