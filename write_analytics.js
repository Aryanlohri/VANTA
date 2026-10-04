const fs = require('fs');
const content = `'use client';

import { useEffect, useState, useMemo } from 'react';
import { reviewApi } from '@/lib/api';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { Activity, Shield, Bug, Zap, Palette, CheckCircle, FileCode } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlowCard } from '@/components/dashboard/GlowCard';
import { getScoreBand, cn } from '@/lib/utils';
import { CountUp } from '@/components/dashboard/CountUp';

const TYPE_COLORS: Record<string, string> = {
  bug: '#ef4444',         // Soft red
  security: '#f97316',    // Soft orange
  performance: '#737373', // Gray
  style: '#a3a3a3',       // Lighter gray
  best_practice: '#525252',// Darker gray
  default: '#888888'
};

const HUMAN_LABELS: Record<string, string> = {
  bug: 'Bug',
  security: 'Security',
  performance: 'Performance',
  style: 'Style',
  best_practice: 'Best practice',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#050505] border border-[var(--color-border)] p-2 rounded-lg shadow-xl flex items-center gap-2">
        <span className="text-[10px] tracking-widest uppercase text-[#616161]">{label}</span>
        <span className="text-[13px] font-bold tabular-nums text-[#e8e8e8]">{data.value}</span>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'score' | 'reviews'>('reviews');
  const [range, setRange] = useState<'7D' | '30D' | '90D' | 'All'>('30D');

  const isReducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  useEffect(() => {
    reviewApi.getAnalytics()
      .then(res => setData(res.data.data))
      .catch(err => console.error('Failed to load analytics', err))
      .finally(() => setLoading(false));
  }, []);

  const pieData = useMemo(() => {
    if (!data?.issuesBreakdown) return [];
    return Object.entries(data.issuesBreakdown).map(([name, value]) => ({
      name,
      value: value as number,
      fill: TYPE_COLORS[name] || TYPE_COLORS.default,
      label: HUMAN_LABELS[name] || name
    })).sort((a, b) => b.value - a.value);
  }, [data]);

  const totalIssues = useMemo(() => {
    return pieData.reduce((acc, curr) => acc + curr.value, 0);
  }, [pieData]);

  // Transform activity data based on selected metric
  const chartData = useMemo(() => {
    if (!data?.recentActivity) return [];
    // Mocking metric toggle since backend only returns count right now
    // TODO: get real score/reviews time series from backend
    return data.recentActivity.map((d: any, i: number) => {
      const dateObj = new Date(d.date);
      const val = metric === 'reviews' ? d.count : (60 + Math.random() * 30).toFixed(0); // mock score
      return {
        rawDate: dateObj.getTime(), // true time
        date: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: Number(val)
      };
    }).sort((a: any, b: any) => a.rawDate - b.rawDate);
  }, [data, metric]);

  const scoreBand = getScoreBand(data?.avgScore);

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Track your code quality and review history"
      />

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px] mb-8">
          {[1,2,3].map(i => <div key={i} className="skeleton h-[124px] rounded-2xl" />)}
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-[#616161]">Failed to load analytics data.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px] mb-8 stagger">
          
          <GlowCard className="p-5 flex flex-col justify-between h-[124px]" glowOpacity={0.06}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-[#898989] mb-3">
              <FileCode size={16} />
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex items-baseline gap-2 mb-0.5">
                <div className="text-2xl font-bold tabular-nums text-[#e8e8e8] min-h-[32px]">
                  <CountUp value={data.totalReviews} duration={0.6} />
                </div>
                {/* Mock delta */}
                <span className="text-[10px] font-medium text-[#22c55e] bg-[#22c55e]/10 px-1 py-0.5 rounded">+12</span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-[#616161]">Total Reviews</p>
            </div>
          </GlowCard>

          <GlowCard className="p-5 flex flex-col justify-between h-[124px]" glowOpacity={0.06}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-[#898989] mb-3">
              <CheckCircle size={16} />
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex items-baseline gap-2 mb-0.5">
                <div className={cn("text-2xl font-bold tabular-nums min-h-[32px]", scoreBand.textClass)}>
                  <CountUp value={data.avgScore} duration={0.7} />
                  <span className="text-sm font-medium ml-0.5">/100</span>
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-[#616161]">Avg Quality Score</p>
            </div>
          </GlowCard>

          <GlowCard className="p-5 flex flex-col justify-between h-[124px]" glowOpacity={0.06}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-[#898989] mb-3">
              <Shield size={16} />
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex items-baseline gap-2 mb-0.5">
                <div className="text-2xl font-bold tabular-nums text-[#e8e8e8] min-h-[32px]">
                  <CountUp value={data.totalIssues} duration={0.8} />
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-[#616161]">Issues Prevented</p>
            </div>
          </GlowCard>

        </div>
      )}

      {/* Charts */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger">
          
          {/* Activity Chart */}
          <GlowCard className="p-6 lg:col-span-2 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h3 className="text-sm font-semibold text-[#e8e8e8]">Review Activity ({range})</h3>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#050505] border border-[var(--color-border)] rounded-lg p-0.5">
                  {['reviews', 'score'].map(m => (
                    <button 
                      key={m}
                      onClick={() => setMetric(m as any)}
                      className={cn(
                        "px-3 py-1 text-[11px] font-medium uppercase tracking-wider rounded-md transition-colors",
                        metric === m ? "bg-white/10 text-[#e8e8e8]" : "text-[#616161] hover:text-[#898989]"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center bg-[#050505] border border-[var(--color-border)] rounded-lg p-0.5">
                  {['7D', '30D', '90D', 'All'].map(r => (
                    <button 
                      key={r}
                      onClick={() => setRange(r as any)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider rounded-md transition-colors",
                        range === r ? "bg-white/10 text-[#e8e8e8]" : "text-[#616161] hover:text-[#898989]"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[260px] w-full">
              {chartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-[13px] text-[#616161]">No activity data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e8e8e8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#e8e8e8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#494949" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="#494949" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => metric === 'score' ? val : val}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#e8e8e8" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      animationDuration={isReducedMotion ? 0 : 700}
                      animationEasing="ease-out"
                      activeDot={{ r: 4, fill: metric === 'score' ? scoreBand.color : '#e8e8e8', stroke: 'rgba(255,255,255,0.2)', strokeWidth: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlowCard>

          {/* Issues by Type */}
          <GlowCard className="p-6 flex flex-col">
            <h3 className="text-sm font-semibold text-[#e8e8e8] mb-6">Issues by Type</h3>
            
            <div className="relative h-40 mb-6 flex items-center justify-center">
              {pieData.length === 0 ? (
                <div className="text-[13px] text-[#616161]">No issues found</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={65}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        animationDuration={isReducedMotion ? 0 : 700}
                        animationEasing="ease-out"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={\`cell-\${index}\`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold tabular-nums text-[#e8e8e8]">{totalIssues}</span>
                    <span className="text-[10px] uppercase tracking-widest text-[#616161]">Issues</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="space-y-1.5 flex-1">
              {pieData.map((entry, i) => {
                const percent = totalIssues > 0 ? Math.round((entry.value / totalIssues) * 100) : 0;
                return (
                  <div key={i} className="flex items-center justify-between group cursor-default p-1.5 -mx-1.5 rounded hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-[12px] text-[#898989] group-hover:text-[#e8e8e8] transition-colors">{entry.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-medium tabular-nums text-[#e8e8e8]">{entry.value}</span>
                      <span className="text-[11px] tabular-nums text-[#616161] w-8 text-right">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlowCard>

        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('client/src/app/dashboard/analytics/page.tsx', content);
console.log("Rewrote analytics page!");
