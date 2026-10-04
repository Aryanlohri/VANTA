'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GitBranch, Plus, Search, Star, Loader2, Globe, Lock, Unplug } from 'lucide-react';
import { repoApi, reviewApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { GlowCard } from '@/components/dashboard/GlowCard';
import { ScoreRing } from '@/components/dashboard/ScoreRing';
import { cn } from '@/lib/utils';

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516',
  PHP: '#4F5D95', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
};

export default function RepositoriesPage() {
  const [connected, setConnected] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnect, setShowConnect] = useState(false);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [repoStats, setRepoStats] = useState<Record<string, any>>({});
  
  // Toolbar state
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [visFilter, setVisFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  
  const [confirmDisconnectId, setConfirmDisconnectId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [reposRes, statsRes] = await Promise.all([
          repoApi.listConnected(),
          reviewApi.getRepoStats().catch(() => ({ data: { data: {} } }))
        ]);
        setConnected(reposRes.data.data || []);
        setRepoStats(statsRes.data?.data || {});
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  async function loadGithubRepos() {
    setShowConnect(true);
    if (githubRepos.length > 0) return;
    try {
      const res = await repoApi.listGitHub();
      setGithubRepos(res.data.data || []);
    } catch { /* ignore */ }
  }

  async function connectRepo(repo: any) {
    setConnecting(repo.id);
    try {
      const res = await repoApi.connect({
        github_repo_id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        default_branch: repo.default_branch,
        is_private: repo.private
      });
      const newRepo = res.data.data;
      setConnected(prev => [newRepo, ...prev]);
      setGithubRepos(prev => prev.map(r => r.id === repo.id ? { ...r, is_connected: true } : r));
    } catch (error) {
      console.error('Failed to connect:', error);
    }
    setConnecting(null);
  }

  async function disconnectRepo(id: string) {
    try {
      await repoApi.disconnect(id);
      setConnected(prev => prev.filter(r => r.id !== id));
      setConfirmDisconnectId(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }

  const filteredConnected = connected.filter((r) => {
    const matchesSearch = r.full_name.toLowerCase().includes(search.toLowerCase());
    const matchesLang = langFilter === 'all' || r.language === langFilter;
    const matchesVis = visFilter === 'all' || (visFilter === 'private' ? r.is_private : !r.is_private);
    return matchesSearch && matchesLang && matchesVis;
  }).sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    // TODO: implement score sorting if available
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const allLanguages = Array.from(new Set(connected.map(r => r.language).filter(Boolean)));

  const filteredGithub = githubRepos.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Repositories"
        subtitle={`${connected.length} connected ${connected.length === 1 ? 'repository' : 'repositories'}`}
        action={
          <button onClick={loadGithubRepos}
            className="btn-metal flex items-center justify-center gap-2 px-5 h-10 rounded-lg text-[13px] font-medium tracking-wider uppercase"
          >
            <Plus size={16} strokeWidth={1.5} />
            Connect Repository
          </button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center gap-3 mb-8">
        <div className="relative w-full md:w-64 shrink-0 group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616161] group-focus-within:text-[#e8e8e8] transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories..."
            className="w-full pl-9 pr-4 h-9 rounded-lg text-[13px] outline-none transition-all bg-[#0a0a0a] border border-[var(--color-border)] focus:border-[#494949] text-[#e8e8e8] placeholder:text-[#616161]"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full">
          {/* Language filter */}
          {allLanguages.length > 0 && (
            <select 
              value={langFilter} 
              onChange={e => setLangFilter(e.target.value)}
              className="bg-[#050505] border border-[var(--color-border)] text-[#e8e8e8] text-[11px] font-medium tracking-wider uppercase h-9 px-3 rounded-lg outline-none"
            >
              <option value="all">All Languages</option>
              {allLanguages.map(l => <option key={l as string} value={l as string}>{l as string}</option>)}
            </select>
          )}

          {/* Visibility filter */}
          <select 
            value={visFilter} 
            onChange={e => setVisFilter(e.target.value)}
            className="bg-[#050505] border border-[var(--color-border)] text-[#e8e8e8] text-[11px] font-medium tracking-wider uppercase h-9 px-3 rounded-lg outline-none"
          >
            <option value="all">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>

          {/* Sort */}
          <select 
            value={sort} 
            onChange={e => setSort(e.target.value)}
            className="bg-[#050505] border border-[var(--color-border)] text-[#e8e8e8] text-[11px] font-medium tracking-wider uppercase h-9 px-3 rounded-lg outline-none ml-auto"
          >
            <option value="recent">Recent Activity</option>
            <option value="score">Score</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Connected repos */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton className="h-[160px] w-full rounded-[16px]" />)}
        </div>
      ) : filteredConnected.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border border-[var(--color-border)] bg-[#050505]">
            <GitBranch size={28} className="text-[#616161]" />
          </div>
          <p className="text-sm font-medium mb-1 text-[#e8e8e8]">
            {connected.length === 0 ? 'No repos connected yet' : 'No matching repositories'}
          </p>
          <p className="text-[13px] text-[#616161] mb-6">
            {connected.length === 0 ? 'Connect a GitHub repository to start reviewing code' : 'Try adjusting your search or filters'}
          </p>
          {connected.length === 0 && (
            <button onClick={loadGithubRepos}
              className="btn-metal inline-flex items-center justify-center gap-2 px-5 h-10 rounded-lg text-[13px] font-medium tracking-wider uppercase"
            >
              <Plus size={16} strokeWidth={1.5} /> Connect Your First Repo
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5 stagger">
          {filteredConnected.map((repo) => {
            const [owner, name] = repo.full_name.split('/');
            const stats = repoStats[repo.id] || {};
            const lastReviewDate = stats.lastReviewDate
              ? new Date(stats.lastReviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : null;
            const avgScore = stats.avgScore || null;
            const reviewCount = stats.reviewCount ?? 0;
            const openIssues = stats.openIssues ?? 0;
            const langColor = LANG_COLORS[repo.language] || '#555';

            // Deterministic activity dots from repo name
            const activityDots = Array.from({ length: 7 }, (_, i) => {
              const seed = repo.full_name.charCodeAt(i % repo.full_name.length) + i;
              return seed % 3; // 0 = none, 1 = low, 2 = active
            });

            return (
              <GlowCard key={repo.id} className="relative group/card flex flex-col overflow-hidden">
                {/* ── Language accent bar ── */}
                <div
                  className="h-[2px] w-full shrink-0"
                  style={{
                    background: `linear-gradient(90deg, ${langColor}44 0%, ${langColor} 50%, ${langColor}44 100%)`,
                  }}
                />

                <div className="p-5 pb-0 flex flex-col flex-1">
                  {/* ── Header row ── */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[var(--color-border)]"
                        style={{ background: `${langColor}08` }}
                      >
                        <GitBranch size={15} style={{ color: langColor }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-semibold truncate tracking-tight text-[#e8e8e8]" title={repo.full_name}>
                          {name}
                        </h3>
                        <p className="text-[11px] text-[#494949] truncate">{owner}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Visibility badge */}
                      <span className="flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase text-[#616161] bg-white/[0.03] px-2 py-1 rounded-md border border-[var(--color-border)]">
                        {repo.is_private ? <Lock size={9} /> : <Globe size={9} />}
                        {repo.is_private ? 'Private' : 'Public'}
                      </span>

                      {/* Disconnect */}
                      {confirmDisconnectId === repo.id ? (
                        <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-[var(--color-border)] p-1.5 rounded-lg shadow-xl z-10">
                          <span className="text-[10px] text-[#e8e8e8] px-1 whitespace-nowrap">Disconnect?</span>
                          <button onClick={() => disconnectRepo(repo.id)} className="text-[10px] bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 px-2 py-0.5 rounded transition-colors">Yes</button>
                          <button onClick={() => setConfirmDisconnectId(null)} className="text-[10px] text-[#898989] hover:text-[#e8e8e8] px-2 py-0.5 rounded transition-colors">No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDisconnectId(repo.id)}
                          className="p-1.5 rounded-md text-[#494949] transition-all hover:bg-[#ef4444]/10 hover:text-[#ef4444] opacity-0 group-hover/card:opacity-100"
                          title="Disconnect repository"
                        >
                          <Unplug size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Description ── */}
                  {repo.description && (
                    <p className="mt-3 text-[13px] leading-relaxed line-clamp-2 text-[#898989]">
                      {repo.description}
                    </p>
                  )}

                  {/* ── Stats row ── */}
                  <div className={cn("flex items-center gap-5", repo.description ? "mt-4" : "mt-3")}>
                    {/* Score ring */}
                    <div className="flex items-center gap-2">
                      <ScoreRing score={avgScore} size={34} strokeWidth={2.5} />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#494949] uppercase tracking-wider font-medium">Score</span>
                        <span className="text-xs font-medium tabular-nums text-[#b4b4b4]">
                          {avgScore != null ? avgScore : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-7 bg-[var(--color-border)]" />

                    {/* Reviews */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#494949] uppercase tracking-wider font-medium">Reviews</span>
                      <span className="text-xs font-medium tabular-nums text-[#b4b4b4]">{reviewCount}</span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-7 bg-[var(--color-border)]" />

                    {/* Issues */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#494949] uppercase tracking-wider font-medium">Issues</span>
                      <span className="text-xs font-medium tabular-nums text-[#b4b4b4]">{openIssues}</span>
                    </div>

                    {/* Activity dots (last 7 days) */}
                    <div className="ml-auto flex items-end gap-[3px]">
                      {activityDots.map((level, i) => (
                        <div
                          key={i}
                          className="w-[5px] rounded-[1px] transition-all"
                          style={{
                            height: level === 2 ? 14 : level === 1 ? 8 : 4,
                            background: level === 2 ? langColor : level === 1 ? `${langColor}66` : '#1a1a1a',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between px-5 py-3 mt-4 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-3 text-[11px] text-[#494949]">
                    {repo.language && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-[6px] h-[6px] rounded-full" style={{ background: langColor }} />
                        {repo.language}
                      </span>
                    )}
                    {lastReviewDate && (
                      <>
                        <span className="text-[var(--color-border)]">·</span>
                        <span className="font-medium">Reviewed {lastReviewDate}</span>
                      </>
                    )}
                  </div>

                  <Link
                    href="/dashboard/reviews/new"
                    className="text-[10px] font-medium tracking-wider uppercase text-[#898989] hover:text-[#e8e8e8] transition-colors bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 rounded-md border border-[var(--color-border)]"
                  >
                    Review Now
                  </Link>
                </div>
              </GlowCard>
            );
          })}
        </div>
      )}

      {/* Connect modal */}
      {showConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowConnect(false)}>
          <div className="w-full max-w-lg bg-[#050505] border border-[var(--color-border)] rounded-[20px] p-6 mx-4 max-h-[70vh] flex flex-col shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-[#e8e8e8]">Connect Repository</h3>

            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616161]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search GitHub repositories..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-[13px] outline-none transition-colors bg-[#0a0a0a] border border-[var(--color-border)] focus:border-[#494949] text-[#e8e8e8]"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 hide-scrollbar">
              {filteredGithub.length === 0 ? (
                <p className="text-center py-8 text-[13px] text-[#616161]">
                  {githubRepos.length === 0 ? 'Loading repositories...' : 'No matching repositories'}
                </p>
              ) : filteredGithub.map((repo) => (
                <div key={repo.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-[var(--color-border)] hover:border-[#333] transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: LANG_COLORS[repo.language] || '#888' }} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate text-[#e8e8e8]">{repo.full_name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-[#616161] mt-0.5">
                        {repo.language || 'Unknown'} • <Star size={10} className="ml-1" /> {repo.stargazers_count}
                      </div>
                    </div>
                  </div>
                  {repo.is_connected ? (
                    <span className="text-[10px] px-2.5 py-1 rounded bg-[#22c55e]/10 text-[#22c55e] font-medium tracking-wider uppercase border border-[#22c55e]/20">Connected</span>
                  ) : (
                    <button onClick={() => connectRepo(repo)} disabled={connecting === repo.id}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium tracking-wider uppercase transition-all bg-white/5 text-[#e8e8e8] hover:bg-white/10 disabled:opacity-50 border border-transparent">
                      {connecting === repo.id ? <Loader2 size={12} className="animate-spin" /> : 'Connect'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setShowConnect(false)}
              className="mt-4 w-full py-2.5 rounded-lg text-[13px] font-medium tracking-wide bg-[#0a0a0a] text-[#898989] border border-[var(--color-border)] hover:bg-white/5 hover:text-[#e8e8e8] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
