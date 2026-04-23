'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileCode, Plus, Clock, Trash2, Filter } from 'lucide-react';
import { reviewApi } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', processing: '#3b82f6', completed: '#22c55e', failed: '#ef4444',
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await reviewApi.list();
        setReviews(res.data.data || []);
      } catch { /* service may not be running */ }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === 'all' ? reviews : reviews.filter((r: any) => r.status === filter);

  async function deleteReview(id: string) {
    try {
      await reviewApi.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Reviews</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {reviews.length} total {reviews.length === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        <Link href="/dashboard/reviews/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))', color: 'white' }}>
          <Plus size={16} /> New Review
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'processing', 'completed', 'failed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
            style={{
              background: filter === f ? 'var(--color-accent-glow)' : 'var(--color-bg-hover)',
              color: filter === f ? 'var(--color-accent-start)' : 'var(--color-text-secondary)',
              border: `1px solid ${filter === f ? 'rgba(99,102,241,0.3)' : 'var(--color-border)'}`,
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileCode size={40} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {filter === 'all' ? 'No reviews yet' : `No ${filter} reviews`}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Submit your code for AI-powered analysis
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {filtered.map((review: any) => (
            <Link key={review.id} href={`/dashboard/reviews/${review.id}`}
              className="glass-card p-5 flex items-center gap-4 transition-all duration-200 hover:scale-[1.005] block">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${STATUS_COLORS[review.status]}15`, color: STATUS_COLORS[review.status] }}>
                <FileCode size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{review.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <Clock size={10} /> {new Date(review.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{ background: `${STATUS_COLORS[review.status]}20`, color: STATUS_COLORS[review.status] }}>
                    {review.status}
                  </span>
                </div>
              </div>
              {review.overall_score !== null && (
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold" style={{
                    color: review.overall_score >= 80 ? '#22c55e' : review.overall_score >= 60 ? '#f59e0b' : '#ef4444'
                  }}>{review.overall_score}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>/100</p>
                </div>
              )}
              <button onClick={(e) => { e.preventDefault(); deleteReview(review.id); }}
                className="p-2 rounded-lg transition-all hover:opacity-70"
                style={{ color: 'var(--color-text-muted)' }} title="Delete">
                <Trash2 size={14} />
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
