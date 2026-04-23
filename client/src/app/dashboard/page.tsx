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
      <div className="grid grid-cols-4 gap-4 mb-8 stagger">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5 transition-all duration-200 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${stat.color}15`, color: stat.color }}>
                <stat.icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
              {loading ? <span className="skeleton inline-block w-12 h-7" /> : stat.value}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Reviews */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/dashboard/reviews/new"
              className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200"
              style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))', color: 'white' }}>
                <Plus size={14} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>New Review</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Submit code for AI analysis</p>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--color-text-muted)' }} />
            </Link>

            <Link href="/dashboard/repositories"
              className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200"
              style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#6366f115', color: '#6366f1' }}>
                <GitBranch size={14} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Connect Repo</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Link a GitHub repository</p>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--color-text-muted)' }} />
            </Link>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recent Reviews</h3>
            <Link href="/dashboard/reviews" className="text-xs font-medium transition-colors" style={{ color: 'var(--color-accent-start)' }}>
              View All <ArrowRight size={12} className="inline" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full" />)}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <FileCode size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No reviews yet</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Submit your first review to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reviews.slice(0, 5).map((review: any) => (
                <Link key={review.id} href={`/dashboard/reviews/${review.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg transition-all duration-200 hover:scale-[1.01]"
                  style={{ background: 'var(--color-bg-hover)' }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[review.status] || '#888' }} />
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
