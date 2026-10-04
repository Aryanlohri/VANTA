'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GitBranch, Plus, Search, Star, Loader2, Globe, Lock, Unplug } from 'lucide-react';
import { repoApi, reviewApi } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
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
          repoApi.list(),
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
      const res = await repoApi.listGithubRepos();
      setGithubRepos(res.data.data || []);
    } catch { /* ignore */ }
  }

  async function connectRepo(repo: any) {
    setConnecting(repo.id);
    try {
      const res = await repoApi.connect(repo.owner?.login || repo.full_name.split('/')[0], repo.name);
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
      await repoApi.delete(id);
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
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-[160px] w-full rounded-[16px]" />)}
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
        <div className="grid md:grid-cols-2 gap-4 stagger">
          {filteredConnected.map((repo) => {
            const [owner, name] = repo.full_name.split('/');
            // Mocking repo stats based on spec requirements
            const stats = repoStats[repo.id] || {};
            const lastReviewDate = stats.lastReviewDate ? new Date(stats.lastReviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Never';
            const avgScore = stats.avgScore || null;
            const openIssues = stats.openIssues || 0;

            return (
              <GlowCard key={repo.id} className="p-5 flex flex-col h-[160px] relative group/card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 shrink-0 border border-[var(--color-border)]">
                      <GitBranch size={14} className="text-[#898989]" />
                    </div>
                    <h3 className="text-sm font-semibold truncate tracking-tight text-[#e8e8e8]" title={repo.full_name}>
                      <span className="text-[#616161] font-normal">{owner}/</span>{name}
                    </h3>
                  </div>
                  
                  <div className="relative flex items-center shrink-0">
                    {confirmDisconnectId === repo.id ? (
                      <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[var(--color-border)] p-1 rounded shadow-xl absolute right-0 top-0">
                        <span className="text-[10px] text-[#e8e8e8] px-1 whitespace-nowrap">Disconnect repository?</span>
                        <button onClick={() => disconnectRepo(repo.id)} className="text-[10px] bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 px-2 py-0.5 rounded transition-colors">Yes</button>
                        <button onClick={() => setConfirmDisconnectId(null)} className="text-[10px] text-[#898989] hover:text-[#e8e8e8] px-2 py-0.5 rounded transition-colors">No</button>
                      </div>
                    ) : (
                      <div className="group/unplug relative flex items-center">
                        <button onClick={() => setConfirmDisconnectId(repo.id)}
                          className="p-1.5 rounded text-[#616161] transition-all hover:bg-[#ef4444]/10 hover:text-[#ef4444] opacity-0 group-hover/card:opacity-100"
                        >
                          <Unplug size={14} />
                        </button>
                        <div className="absolute right-full mr-2 px-2 py-1 bg-[#0a0a0a] border border-[var(--color-border)] rounded text-[10px] text-white opacity-0 group-hover/unplug:opacity-100 pointer-events-none whitespace-nowrap z-50">
                          Disconnect repository
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 flex-1">
                  {repo.description ? (
                    <p className="text-[13px] leading-relaxed line-clamp-2 text-[#898989]">
                      {repo.description}
                    </p>
                  ) : (
                    <div className="flex items-center gap-6 mt-1">
                      <div className="flex items-center gap-2">
                        <ScoreRing score={avgScore} size={32} strokeWidth={2.5} />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#616161] uppercase tracking-wider">Avg Score</span>
                          <span className="text-xs font-medium text-[#e8e8e8]">{lastReviewDate}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#616161] uppercase tracking-wider">Open Issues</span>
                        <span className="text-xs font-medium text-[#e8e8e8]">{openIssues}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs pt-4 border-t border-[var(--color-border)] mt-auto">
                  <div className="flex items-center gap-4 text-[#616161]">
                    {repo.language && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full" style={{ background: LANG_COLORS[repo.language] || '#888' }} />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-medium bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      {repo.is_private ? <Lock size={10} /> : <Globe size={10} />}
                      {repo.is_private ? 'Private' : 'Public'}
                    </span>
                  </div>
                  
                  <Link href="/dashboard/reviews/new" className="text-[11px] font-medium tracking-wider uppercase text-[#e8e8e8] opacity-0 group-hover/card:opacity-100 transition-opacity bg-white/10 px-2.5 py-1 rounded hover:bg-white/20">
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
