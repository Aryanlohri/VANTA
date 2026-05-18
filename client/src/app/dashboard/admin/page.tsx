'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, FileCode, Shield, Server, Activity, CreditCard, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [authMetrics, setAuthMetrics] = useState<any>(null);
  const [reviewMetrics, setReviewMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Basic frontend role check (backend also protects routes)
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    async function loadMetrics() {
      try {
        const [authRes, reviewRes] = await Promise.all([
          adminApi.getAuthMetrics(),
          adminApi.getReviewMetrics()
        ]);
        
        setAuthMetrics(authRes.data.data);
        setReviewMetrics(reviewRes.data.data);
      } catch (err: any) {
        console.error('Failed to load admin metrics:', err);
        setError(err.response?.data?.error?.message || 'Failed to load metrics. Are you an admin?');
      } finally {
        setLoading(false);
      }
    }

    if (user) loadMetrics();
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 border-red-500/20 bg-red-500/5">
        <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
        <p className="text-red-400/80">{error}</p>
      </div>
    );
  }

  const activeSubs = Object.entries(authMetrics?.subscriptions || {}).reduce(
    (acc: number, [plan, count]: any) => (plan !== 'free' ? acc + count : acc),
    0
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
          <Shield size={20} className="text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Platform Admin</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>System metrics and user activity overview</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger">
        {/* Total Users */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center gap-3 mb-4">
            <Users size={18} className="text-blue-400" />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Users</span>
          </div>
          <p className="text-3xl font-bold text-white">{authMetrics?.totalUsers || 0}</p>
        </div>

        {/* Total Reviews */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-center gap-3 mb-4">
            <FileCode size={18} className="text-purple-400" />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Reviews</span>
          </div>
          <p className="text-3xl font-bold text-white">{reviewMetrics?.totalReviews || 0}</p>
        </div>

        {/* 24h Activity */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors" />
          <div className="flex items-center gap-3 mb-4">
            <Activity size={18} className="text-green-400" />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Last 24h Reviews</span>
          </div>
          <p className="text-3xl font-bold text-white">{reviewMetrics?.recentReviews || 0}</p>
        </div>

        {/* Active Subs */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center gap-3 mb-4">
            <CreditCard size={18} className="text-amber-400" />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Active Paid Subs</span>
          </div>
          <p className="text-3xl font-bold text-white">{activeSubs}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Server size={18} className="text-emerald-400" />
            Infrastructure Status
          </h2>
          <div className="space-y-4">
            {['API Gateway', 'Auth Service', 'Repository Service', 'Review Service', 'AI Service'].map(service => (
              <div key={service} className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--color-bg-hover)' }}>
                <span className="text-sm font-medium text-gray-300">{service}</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Online</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
