'use client';

import { useEffect, useState } from 'react';
import { GitBranch, Plus, Unplug, Search, Star, Lock, Globe, Loader2 } from 'lucide-react';
import { repoApi } from '@/lib/api';

export default function RepositoriesPage() {
  const [connected, setConnected] = useState<any[]>([]);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [showConnect, setShowConnect] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<number | null>(null);

  useEffect(() => {
    loadConnected();
  }, []);

  async function loadConnected() {
    try {
      const res = await repoApi.listConnected();
      setConnected(res.data.data || []);
    } catch { /* service may not be running */ }
    setLoading(false);
  }

  async function loadGithubRepos() {
    setShowConnect(true);
    try {
      const res = await repoApi.listGitHub();
      setGithubRepos(res.data.data || []);
    } catch { /* service may not be running */ }
  }

  async function connectRepo(repo: any) {
    setConnecting(repo.id);
    try {
      await repoApi.connect({
        github_repo_id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        default_branch: repo.default_branch,
        is_private: repo.private,
      });
      await loadConnected();
      setGithubRepos((prev) => prev.map((r) => r.id === repo.id ? { ...r, is_connected: true } : r));
    } catch (error) {
      console.error('Failed to connect repo:', error);
    }
    setConnecting(null);
  }

  async function disconnectRepo(id: string) {
    try {
      await repoApi.disconnect(id);
      setConnected((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }

  const LANG_COLORS: Record<string, string> = {
    JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572A5',
    Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516',
    PHP: '#4F5D95', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  };

  const filtered = githubRepos.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Repositories</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {connected.length} connected {connected.length === 1 ? 'repository' : 'repositories'}
          </p>
        </div>
        <button onClick={loadGithubRepos}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))', color: 'white' }}>
          <Plus size={16} /> Connect Repository
        </button>
      </div>

      {/* Connected repos */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28" />)}
        </div>
      ) : connected.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <GitBranch size={40} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>No repos connected yet</p>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Connect a GitHub repository to start reviewing code</p>
          <button onClick={loadGithubRepos}
            className="px-6 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))', color: 'white' }}>
            <Plus size={14} className="inline mr-2" /> Connect Your First Repo
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 stagger">
          {connected.map((repo) => (
            <div key={repo.id} className="glass-card p-5 transition-all duration-200 hover:scale-[1.01]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <GitBranch size={18} style={{ color: 'var(--color-accent-start)' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{repo.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{repo.description || 'No description'}</p>
                  </div>
                </div>
                <button onClick={() => disconnectRepo(repo.id)}
                  className="p-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ color: 'var(--color-text-muted)' }} title="Disconnect">
                  <Unplug size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: LANG_COLORS[repo.language] || '#888' }} />
                    {repo.language}
                  </span>
                )}
                {repo.is_private ? <Lock size={10} /> : <Globe size={10} />}
                <span>{repo.is_private ? 'Private' : 'Public'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect modal */}
      {showConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowConnect(false)}>
          <div className="w-full max-w-lg glass-card p-6 mx-4 max-h-[70vh] flex flex-col animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Connect Repository</h3>

            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search repositories..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filtered.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {githubRepos.length === 0 ? 'Loading repositories...' : 'No matching repositories'}
                </p>
              ) : filtered.map((repo) => (
                <div key={repo.id} className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: LANG_COLORS[repo.language] || '#888' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{repo.full_name}</p>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {repo.language || 'Unknown'} · <Star size={10} /> {repo.stargazers_count}
                      </div>
                    </div>
                  </div>
                  {repo.is_connected ? (
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: '#22c55e20', color: '#22c55e' }}>Connected</span>
                  ) : (
                    <button onClick={() => connectRepo(repo)} disabled={connecting === repo.id}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
                      style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent-start)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      {connecting === repo.id ? <Loader2 size={12} className="animate-spin" /> : 'Connect'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setShowConnect(false)}
              className="mt-4 w-full py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
