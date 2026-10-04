'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GitBranch, FileCode, Plus, BarChart3, Clock, ArrowRight, TrendingUp, Search } from 'lucide-react';
import { repoApi, reviewApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

import { CommandPalette } from '@/components/dashboard/CommandPalette';
import { ReviewRow } from '@/components/dashboard/ReviewRow';
import { ShimmerText } from '@/components/ui/ShimmerText';
import { buildGreetingSummary, GreetingStats } from '@/lib/utils';
import { FirstRunGuide } from '@/components/ui/FirstRunGuide';
import { Skeleton } from '@/components/ui/Skeleton';
import { GlowCard } from '@/components/dashboard/GlowCard';
import { ScoreRing } from '@/components/dashboard/ScoreRing';
import { CountUp } from '@/components/dashboard/CountUp';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { useLiveReviews, useReviewProgress } from '@/components/dashboard/useLiveReviews';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  completed: '#22c55e',
  failed: '#ef4444',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [repos, setRepos] = useState<any[]>([]);
  const [initialReviews, setInitialReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);

  const reviews = useLiveReviews(initialReviews);

  useEffect(() => {
    async function loadData() {
      try {
        const [repoRes, reviewRes] = await Promise.all([
          repoApi.listConnected().catch(() => ({ data: { data: [] } })),
          reviewApi.list().catch(() => ({ data: { data: [] } })),
        ]);
        setRepos(repoRes.data.data || []);
        setInitialReviews(reviewRes.data.data || []);
      } catch {
        // Services may not be running yet
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const avgScore = reviews.length > 0
    ? Math.round(reviews.filter((r: any) => r.overall_score).reduce((a: number, r: any) => a + r.overall_score, 0) / (reviews.filter((r: any) => r.overall_score).length || 1))
    : null;
    
  const thisWeekCount = reviews.filter((r: any) => new Date(r.created_at) > new Date(Date.now() - 7 * 86400000)).length;

  const stats = [
    { id: 'repos', icon: GitBranch, label: 'Connected Repos', value: repos.length, color: '#6366f1', delta: '+1' },
    { id: 'reviews', icon: FileCode, label: 'Total Reviews', value: reviews.length, color: '#22c55e', delta: '+12%' },
    { id: 'score', icon: BarChart3, label: 'Avg Score', value: avgScore, color: '#f59e0b', delta: '+2.4' },
    { id: 'week', icon: TrendingUp, label: 'This Week', value: thisWeekCount, color: '#ec4899', delta: null },
  ];

  const displayName = (user as any)?.display_name || (user as any)?.first_name || user?.username || 'Developer';

  return (
    <>
      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />
      <div>
        {/* Command Strip */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <button
              onClick={() => setCmdOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#0a0a0a] hover:bg-white/5 border border-[var(--color-border)] rounded-xl text-left transition-colors group"
            >
              <Search size={16} className="text-[#616161] group-hover:text-[#898989]" />
              <span className="flex-1 text-sm text-[#616161] group-hover:text-[#e8e8e8]">Search or jump to...</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] tracking-widest text-[#616161] px-1.5 py-0.5 border border-[var(--color-border)] rounded bg-white/5">⌘</span>
                <span className="text-[10px] tracking-widest text-[#616161] px-1.5 py-0.5 border border-[var(--color-border)] rounded bg-white/5">K</span>
              </div>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/dashboard/repositories"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--color-border)] bg-transparent text-[#e8e8e8] hover:bg-white/5 transition-colors">
              <GitBranch size={14} /> Connect Repo
            </Link>
            <Link href="/dashboard/reviews/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium btn-metal transition-transform hover:scale-[1.02]">
              <Plus size={14} /> New Review
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Welcome back, <ShimmerText delay={600}>{displayName}</ShimmerText>
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Here&apos;s an overview of your code review activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px] mb-8 stagger">
            {stats.map((stat, i) => (
              <GlowCard key={stat.label} className="p-5 flex flex-col justify-between h-[124px]" glowOpacity={0.06}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-[#898989] mb-3">
                  <stat.icon size={16} />
                </div>
                
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <div className="text-2xl font-bold tabular-nums text-[#e8e8e8] min-h-[32px]">
                        {loading ? (
                          <Skeleton className="inline-block w-12 h-7 rounded-md" />
                        ) : stat.value === null ? (
                          <span className="text-[#616161] font-medium text-xl">—</span>
                        ) : stat.id === 'week' && stat.value === 0 ? (
                          <span className="text-[#616161]">0</span>
                        ) : (
                          <CountUp value={stat.value as number} duration={0.6 + i * 0.1} />
                        )}
                      </div>
                      {/* Delta stub */}
                      {!loading && stat.delta && stat.value !== 0 && stat.value !== null && (
                        <span className="text-[10px] font-medium text-[#22c55e] bg-[#22c55e]/10 px-1 py-0.5 rounded">
                          {stat.delta}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between group/week">
                      <p className="text-[10px] uppercase tracking-wider text-[#616161]">{stat.label}</p>
                      {/* Zero state hover action for This Week */}
                      {!loading && stat.id === 'week' && stat.value === 0 && (
                        <Link href="/dashboard/reviews/new" className="text-[10px] text-[#898989] hover:text-[#e8e8e8] opacity-0 group-hover/week:opacity-100 transition-opacity">
                          Start one →
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  {/* Sparkline in lower right */}
                  {!loading && stat.value !== null && stat.value !== 0 && (
                    <div className="mb-1 ml-4 shrink-0">
                      <Sparkline color={stat.color} />
                    </div>
                  )}
                </div>
              </GlowCard>
            ))}
          </div>

        {/* Recent Reviews (Full Width) */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[12px] uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>Recent Reviews</h3>
            {reviews.length > 0 && (
              <Link href="/dashboard/reviews" className="text-[11px] font-medium tracking-wider uppercase transition-colors" style={{ color: 'var(--color-accent-start)' }}>
                View All ›
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton className="h-[68px] w-full rounded-2xl" />)}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border border-[var(--color-border)] bg-white/5">
                <FileCode size={28} className="text-[#898989]" />
              </div>
              <h4 className="text-lg font-bold mb-2 text-[#e8e8e8]">Welcome to VANTA</h4>
              <p className="text-sm mb-8 max-w-sm mx-auto text-[#616161]">
                You're just a few clicks away from AI-powered code reviews. Follow these steps to get started.
              </p>
              
              <div className="text-left space-y-3 max-w-sm mx-auto">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[#0a0a0a]">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#22c55e]/20 text-[#22c55e]">✓</div>
                  <span className="text-sm font-medium text-[#e8e8e8]">Create an account</span>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg border transition-all border-[var(--color-border)] bg-[#0a0a0a]">
                  {repos.length === 0 ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold bg-[#898989] text-white">2</div>
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#22c55e]/20 text-[#22c55e]">✓</div>
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium block text-[#e8e8e8]">Connect a Repository</span>
                    {repos.length === 0 && (
                      <Link href="/dashboard/repositories" className="text-xs hover:underline mt-0.5 inline-block text-[#898989]">Go to repositories ›</Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border transition-all" style={{ borderColor: repos.length > 0 ? 'var(--color-border)' : 'var(--color-border)', background: repos.length > 0 ? 'rgba(255,255,255,0.02)' : 'transparent', opacity: repos.length > 0 ? 1 : 0.6 }}>
                  <div className="w-6 h-6 rounded-full border border-[#494949] flex items-center justify-center shrink-0 text-xs font-bold text-[#898989]">3</div>
                  <div className="flex-1">
                    <span className="text-sm font-medium block" style={{ color: repos.length > 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>Run your first review</span>
                    {repos.length > 0 && (
                      <Link href="/dashboard/reviews/new" className="text-xs hover:underline mt-0.5 inline-block text-[#898989]">Start a new review ›</Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {reviews.slice(0, 5).map((review: any) => {
                return <ReviewRow key={review.id} review={review} allReviews={reviews} />;
                })}
                
                {initialReviews.length > 5 && (
                <div className="pt-4 text-center">
                  <Link href="/dashboard/reviews" className="text-[12px] text-[#898989] hover:text-[#e8e8e8] transition-colors">
                    View all reviews ›
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ProgressStage({ review }: { review: any }) {
  const progress = useReviewProgress(review);
  
  return (
    <div className="flex flex-col items-end gap-1 w-24">
      <span className="text-[10px] uppercase tracking-wider text-[#3b82f6] font-medium animate-pulse">
        {progress.stage}
      </span>
      <div className="w-full h-0.5 bg-[#333333] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#3b82f6] transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}
