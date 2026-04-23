'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileCode, FolderOpen, ChevronRight, Send, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { repoApi, reviewApi } from '@/lib/api';

export default function NewReviewPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, { content: string; language: string | null }>>({});
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const res = await repoApi.listConnected();
        setRepos(res.data.data || []);
      } catch { /* */ }
      setLoading(false);
    }
    load();
  }, []);

  async function selectRepo(repo: any) {
    setSelectedRepo(repo);
    setLoadingFiles(true);
    setStep(2);
    try {
      const res = await repoApi.listFiles(repo.id);
      const codeFiles = (res.data.data || []).filter((f: any) =>
        f.type === 'file' && /\.(js|jsx|ts|tsx|py|java|go|rs|c|cpp|rb|php|swift|kt)$/i.test(f.path)
      );
      setFiles(codeFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
    setLoadingFiles(false);
  }

  async function toggleFile(path: string) {
    if (selectedFiles.includes(path)) {
      setSelectedFiles((prev) => prev.filter((f) => f !== path));
      return;
    }

    if (selectedFiles.length >= 20) return; // Max files

    setSelectedFiles((prev) => [...prev, path]);

    // Fetch content if not cached
    if (!fileContents[path]) {
      try {
        const res = await repoApi.getFileContent(selectedRepo.id, path);
        setFileContents((prev) => ({
          ...prev,
          [path]: { content: res.data.data.content, language: res.data.data.language },
        }));
      } catch (error) {
        console.error('Failed to fetch file:', error);
      }
    }
  }

  async function submitReview() {
    if (!selectedRepo || selectedFiles.length === 0 || !title) return;

    setSubmitting(true);
    try {
      const reviewFiles = selectedFiles
        .filter((path) => fileContents[path])
        .map((path) => ({
          path,
          content: fileContents[path].content,
          language: fileContents[path].language,
        }));

      const res = await reviewApi.create({
        repo_id: selectedRepo.id,
        title,
        files: reviewFiles,
      });

      router.push(`/dashboard/reviews/${res.data.data.id}`);
    } catch (error) {
      console.error('Submit failed:', error);
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link href="/dashboard/reviews" className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}>
        <ArrowLeft size={14} /> Back to Reviews
      </Link>

      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>New Review</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
        Select a repository, choose files, and submit for AI review.
      </p>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { num: 1, label: 'Select Repo' },
          { num: 2, label: 'Choose Files' },
          { num: 3, label: 'Submit' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step >= s.num ? 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))' : 'var(--color-bg-hover)',
                  color: step >= s.num ? 'white' : 'var(--color-text-muted)',
                }}>
                {s.num}
              </div>
              <span className="text-xs font-medium" style={{ color: step >= s.num ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                {s.label}
              </span>
            </div>
            {i < 2 && <ChevronRight size={14} style={{ color: 'var(--color-text-muted)' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select repo */}
      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-3 stagger">
          {loading ? (
            [1,2,3,4].map((i) => <div key={i} className="skeleton h-20" />)
          ) : repos.length === 0 ? (
            <div className="col-span-2 glass-card p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No connected repos. <Link href="/dashboard/repositories" className="underline" style={{ color: 'var(--color-accent-start)' }}>Connect one first</Link>.
              </p>
            </div>
          ) : repos.map((repo) => (
            <button key={repo.id} onClick={() => selectRepo(repo)}
              className="glass-card p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:border-[var(--color-border-hover)]">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{repo.full_name}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{repo.language || 'Unknown'} · {repo.default_branch}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Choose files */}
      {step === 2 && (
        <div>
          <div className="glass-card p-4 mb-4">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Repo: <span className="gradient-text">{selectedRepo?.full_name}</span>
            </p>
          </div>

          <div className="glass-card p-4 max-h-96 overflow-y-auto">
            {loadingFiles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-accent-start)' }} />
                <span className="ml-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading files...</span>
              </div>
            ) : files.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>No reviewable code files found</p>
            ) : (
              <div className="space-y-1">
                {files.map((file: any) => {
                  const selected = selectedFiles.includes(file.path);
                  return (
                    <button key={file.path} onClick={() => toggleFile(file.path)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all text-sm"
                      style={{
                        background: selected ? 'var(--color-accent-glow)' : 'transparent',
                        color: selected ? 'var(--color-accent-start)' : 'var(--color-text-secondary)',
                      }}>
                      <FileCode size={14} />
                      <span className="truncate">{file.path}</span>
                      {selected && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between mt-4">
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg text-sm"
              style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}>
              Back
            </button>
            <button onClick={() => setStep(3)} disabled={selectedFiles.length === 0}
              className="px-6 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))', color: 'white' }}>
              Next: {selectedFiles.length} files selected
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Submit */}
      {step === 3 && (
        <div className="max-w-lg">
          <div className="glass-card p-6 space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Review Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder={`Review of ${selectedRepo?.name}`}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Files to review</p>
              <div className="space-y-1">
                {selectedFiles.map((path) => (
                  <div key={path} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}>
                    <FileCode size={12} /> {path}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-lg text-sm"
                style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}>
                Back
              </button>
              <button onClick={submitReview} disabled={!title || submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))', color: 'white' }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? 'Submitting...' : 'Submit for AI Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
