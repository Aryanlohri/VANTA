'use client';

import { useEffect, useState } from 'react';
import { reviewApi } from '@/lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Loader2, Activity, Shield, Bug, Zap, Palette, CheckCircle } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  bug: '#ef4444',
  security: '#f97316',
  performance: '#eab308',
  style: '#3b82f6',
  best_practice: '#22c55e',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewApi.getAnalytics()
      .then(res => setData(res.data.data))
      .catch(err => console.error('Failed to load analytics', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-accent-start)' }} />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-400">Failed to load analytics data.</div>;
  }

  // Format issues data for PieChart
  const pieData = Object.entries(data.issuesBreakdown).map(([name, value]) => ({
    name,
    value
  }));

  // Format activity data for Bar/Line charts
  const activityData = data.recentActivity.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: d.count
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Tech Debt & Analytics</h1>
        <p className="text-sm text-gray-400">Track your code quality and review history across all connected repositories.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <Activity size={32} className="mb-2 text-blue-400" />
          <p className="text-3xl font-bold text-white">{data.totalReviews}</p>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Total Reviews</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <CheckCircle size={32} className="mb-2 text-green-400" />
          <p className="text-3xl font-bold" style={{ color: data.avgScore >= 80 ? '#4ade80' : data.avgScore >= 60 ? '#facc15' : '#f87171' }}>
            {data.avgScore}/100
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Avg Quality Score</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <Bug size={32} className="mb-2 text-red-400" />
          <p className="text-3xl font-bold text-red-400">{data.totalIssues}</p>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Total Issues Prevented</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-white mb-6">Review Activity (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-6">Issues by Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', textTransform: 'capitalize' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {pieData.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-300 capitalize">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[entry.name] || '#6b7280' }} />
                {entry.name}: {entry.value}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
