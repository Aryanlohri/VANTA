'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GitBranch, FileCode, Plus, BarChart3, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { repoApi, reviewApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  completed: '#22c55e',
  failed: '#ef4444',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [repos, setRepos] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [repoRes, reviewRes] = await Promise.all([
          repoApi.listConnected().catch(() => ({ data: { data: [] } })),
          reviewApi.list().catch(() => ({ data: { data: [] } })),
        ]);
        setRepos(repoRes.data.data || []);
        setReviews(reviewRes.data.data || []);
      } catch {
        // Services may not be running yet
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const stats = [
    { icon: GitBranch, label: 'Connected Repos', value: repos.length, color: '#6366f1' },
    { icon: FileCode, label: 'Total Reviews', value: reviews.length, color: '#22c55e' },
    { icon: BarChart3, label: 'Avg Score', value: reviews.length > 0
      ? Math.round(reviews.filter((r: any) => r.overall_score).reduce((a: number, r: any) => a + r.overall_score, 0) / reviews.filter((r: any) => r.overall_score).length) || '—'
      : '—', color: '#f59e0b' },
    { icon: TrendingUp, label: 'This Week', value: reviews.filter((r: any) => new Date(r.created_at) > new Date(Date.now() - 7 * 86400000)).length, color: '#ec4899' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Welcome back, <span className="gradient-text">{user?.username}</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Here&apos;s an overview of your code review activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-[12px] mb-8 stagger">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5 transition-all duration-200 hover:border-[var(--color-border-hover)]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center"
                style={{ background: 'var(--color-bg-hover)', color: stat.color }}>
                <stat.icon size={18} />
              </div>
            </div>
            <p className="text-[28px] font-bold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
              {loading ? <span className="skeleton inline-block w-12 h-7" /> : stat.value}
            </p>
            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Reviews */}
      <div className="grid grid-cols-[1fr_1.6fr] gap-[14px]">
        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="text-[12px] uppercase tracking-[0.08em] mb-4" style={{ color: 'var(--color-text-muted)' }}>Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/dashboard/reviews/new"
              className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-lg transition-all duration-200 hover:bg-[var(--color-bg-hover)] hover:translate-x-[2px]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))', color: 'white' }}>
                <Plus size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>New Review</p>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>Submit code for AI analysis</p>
              </div>
              <span className="text-[16px] leading-none shrink-0" style={{ color: 'var(--color-text-muted)' }}>›</span>
            </Link>

            <Link href="/dashboard/repositories"
              className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-lg transition-all duration-200 hover:bg-[var(--color-bg-hover)] hover:translate-x-[2px]">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: '#6366f115', color: '#6366f1' }}>
                <GitBranch size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Connect Repo</p>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>Link a GitHub repository</p>
              </div>
              <span className="text-[16px] leading-none shrink-0" style={{ color: 'var(--color-text-muted)' }}>›</span>
            </Link>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] uppercase tracking-[0.08em]" style={{ color: 'var(--color-text-muted)' }}>Recent Reviews</h3>
            <Link href="/dashboard/reviews" className="text-xs font-medium transition-colors" style={{ color: 'var(--color-accent-start)' }}>
              View All ›
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full" />)}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)' }}>
                <FileCode size={28} style={{ color: 'var(--color-text-primary)' }} />
              </div>
              <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Welcome to VANTA</h4>
              <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                You're just a few clicks away from AI-powered code reviews. Follow these steps to get started.
              </p>
              
              <div className="text-left space-y-3 max-w-sm mx-auto">
                <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#22c55e20', color: '#22c55e' }}>✓</div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Create an account</span>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg border transition-all" style={{ borderColor: repos.length === 0 ? 'var(--color-accent-start)' : 'var(--color-border)', background: repos.length === 0 ? 'var(--color-accent-glow)' : 'var(--color-bg-input)' }}>
                  {repos.length === 0 ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: 'var(--color-accent-start)', color: 'white' }}>2</div>
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#22c55e20', color: '#22c55e' }}>✓</div>
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium block" style={{ color: 'var(--color-text-primary)' }}>Connect a Repository</span>
                    {repos.length === 0 && (
                      <Link href="/dashboard/repositories" className="text-xs hover:underline mt-0.5 inline-block" style={{ color: 'var(--color-accent-start)' }}>Go to repositories ›</Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border transition-all" style={{ borderColor: repos.length > 0 ? 'var(--color-accent-start)' : 'var(--color-border)', background: repos.length > 0 ? 'var(--color-accent-glow)' : 'transparent', opacity: repos.length > 0 ? 1 : 0.6 }}>
                  <div className="w-6 h-6 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold" style={{ 
                    borderColor: repos.length > 0 ? 'transparent' : 'var(--color-text-muted)', 
                    color: repos.length > 0 ? 'white' : 'var(--color-text-muted)',
                    background: repos.length > 0 ? 'var(--color-accent-start)' : 'transparent'
                  }}>3</div>
                  <div className="flex-1">
                    <span className="text-sm font-medium block" style={{ color: repos.length > 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>Run your first review</span>
                    {repos.length > 0 && (
                      <Link href="/dashboard/reviews/new" className="text-xs hover:underline mt-0.5 inline-block" style={{ color: 'var(--color-accent-start)' }}>Start a new review ›</Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {reviews.slice(0, 5).map((review: any) => (
                <Link key={review.id} href={`/dashboard/reviews/${review.id}`}
                  className="flex items-center gap-4 py-3 px-3 -mx-3 rounded-lg transition-all duration-200 hover:bg-[var(--color-bg-hover)]">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: review.status === 'completed' ? '#22c55e' : STATUS_COLORS[review.status] || '#888' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{review.title}</p>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <Clock size={10} />
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {review.overall_score && (
                    <span className="text-sm font-bold" style={{
                      color: review.overall_score >= 80 ? '#22c55e' : review.overall_score >= 60 ? '#f59e0b' : '#ef4444'
                    }}>
                      {review.overall_score}/100
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{ background: `${STATUS_COLORS[review.status]}20`, color: STATUS_COLORS[review.status] }}>
                    {review.status}
                  </span>
                </Link>
              ))}
              <div className="pt-3 text-center">
                <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>No other reviews yet — start a new one above.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
