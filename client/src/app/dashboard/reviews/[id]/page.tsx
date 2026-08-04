'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, FileCode, Shield, Bug, Zap, Palette, CheckCircle,
  AlertTriangle, Info, ChevronDown, ChevronRight, Lightbulb, Loader2, GitPullRequest
} from 'lucide-react';
import { reviewApi } from '@/lib/api';
import { useSocket } from '@/lib/socket';

// Dynamic import Monaco to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  bug: { icon: Bug, color: '#ef4444', label: 'Bug' },
  security: { icon: Shield, color: '#f97316', label: 'Security' },
  performance: { icon: Zap, color: '#eab308', label: 'Performance' },
  style: { icon: Palette, color: '#3b82f6', label: 'Style' },
  best_practice: { icon: CheckCircle, color: '#22c55e', label: 'Best Practice' },
};

const SEVERITY_CONFIG: Record<string, { color: string; icon: any }> = {
  critical: { color: '#ef4444', icon: AlertTriangle },
  major: { color: '#f59e0b', icon: AlertTriangle },
  minor: { color: '#3b82f6', icon: Info },
  info: { color: '#22c55e', icon: Info },
};

export default function ReviewDetailPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeFile, setActiveFile] = useState(0);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [expandedComment, setExpandedComment] = useState<string | null>(null);
  const [postingToGithub, setPostingToGithub] = useState(false);
  const [postedToGithub, setPostedToGithub] = useState(false);

  const { onEvent } = useSocket(reviewId);
  const [streamedRawText, setStreamedRawText] = useState('');

  // Load review data
  const loadReview = useCallback(async () => {
    try {
      const res = await reviewApi.getById(reviewId);
      setReview(res.data.data);
    } catch (error) {
      console.error('Failed to load review:', error);
    }
    setLoading(false);
  }, [reviewId]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  // Listen for real-time updates
  useEffect(() => {
    const unsub1 = onEvent('review:completed', () => loadReview());
    const unsub2 = onEvent('review:file-complete', () => loadReview());
    const unsub3 = onEvent('review:failed', () => loadReview());
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [onEvent, loadReview]);

  // Listen to SSE Stream if processing
  useEffect(() => {
    if (!review || review.status !== 'processing') return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const token = localStorage.getItem('aicr_token');
    const evtSource = new EventSource(`${apiUrl}/reviews/${reviewId}/stream${token ? `?token=${token}` : ''}`);

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.text) {
          setStreamedRawText((prev) => prev + data.text);
        }
      } catch (err) {
        console.error('SSE Error parsing data:', err);
      }
    };

    evtSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      evtSource.close();
    };

    return () => {
      evtSource.close();
    };
  }, [review?.status, reviewId]);

  const handlePostToGithub = async () => {
    if (!review || !review.pull_request_number) return;
    setPostingToGithub(true);
    try {
      await reviewApi.postToGitHub(review.id);
      setPostedToGithub(true);
    } catch (error) {
      console.error('Failed to post to GitHub:', error);
      alert('Failed to post review to GitHub. Please try again.');
    } finally {
      setPostingToGithub(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-accent-start)' }} />
        <span className="ml-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading review...</span>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="text-center py-20">
        <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>Review not found</p>
      </div>
    );
  }

  const currentFile = review.files?.[activeFile];
  const comments = currentFile?.comments || [];
  const filteredComments = filterType ? comments.filter((c: any) => c.type === filterType) : comments;

  // Score gauge
  const score = review.overall_score || 0;
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  // Comment counts by type
  const allComments = review.files?.flatMap((f: any) => f.comments || []) || [];
  const typeCounts = allComments.reduce((acc: any, c: any) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {});

  // Monaco decorations for highlighted lines
  function handleEditorDidMount(editor: any, monaco: any) {
    if (!currentFile?.comments) return;

    const decorations = currentFile.comments.map((comment: any) => {
      const severity = SEVERITY_CONFIG[comment.severity] || SEVERITY_CONFIG.info;
      return {
        range: new monaco.Range(comment.line_number, 1, comment.line_number, 1),
        options: {
          isWholeLine: true,
          className: `review-highlight-${comment.severity}`,
          glyphMarginClassName: `review-glyph-${comment.type}`,
          overviewRuler: {
            color: severity.color,
            position: monaco.editor.OverviewRulerLane.Right,
          },
        },
      };
    });

    editor.deltaDecorations([], decorations);
  }

  return (
    <div>
      <Link href="/dashboard/reviews" className="inline-flex items-center gap-2 text-sm mb-4 transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}>
        <ArrowLeft size={14} /> Back to Reviews
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{review.title}</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {new Date(review.created_at).toLocaleString()} · {review.files?.length || 0} files
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Post to GitHub button for PRs */}
          {review.status === 'completed' && review.pull_request_number && (
            <button
              onClick={handlePostToGithub}
              disabled={postingToGithub || postedToGithub}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
              style={{ 
                background: postedToGithub ? 'rgba(34,197,94,0.1)' : 'var(--color-bg-hover)', 
                color: postedToGithub ? '#22c55e' : 'var(--color-text-primary)',
                border: `1px solid ${postedToGithub ? 'rgba(34,197,94,0.2)' : 'var(--color-border)'}`,
                opacity: (postingToGithub || postedToGithub) ? 0.7 : 1,
                cursor: (postingToGithub || postedToGithub) ? 'default' : 'pointer'
              }}
            >
              {postingToGithub ? (
                <Loader2 size={16} className="animate-spin" />
              ) : postedToGithub ? (
                <CheckCircle size={16} />
              ) : (
                <GitPullRequest size={16} />
              )}
              <span className="text-sm font-medium">
                {postingToGithub ? 'Posting...' : postedToGithub ? 'Posted to PR' : 'Post to GitHub'}
              </span>
            </button>
          )}

          {/* Status badge */}
          {review.status === 'processing' ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: '#3b82f6' }} />
              <span className="text-xs font-medium" style={{ color: '#3b82f6' }}>AI is reviewing...</span>
            </div>
          ) : review.status === 'completed' ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle size={14} style={{ color: '#22c55e' }} />
              <span className="text-xs font-medium" style={{ color: '#22c55e' }}>Review Complete</span>
            </div>
          ) : null}

          {/* Mode badge */}
          {review.mode && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                {review.mode.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Live Stream Terminal */}
      {review.status === 'processing' && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
            <Loader2 size={14} className="animate-spin" /> Live AI Analysis Stream
          </h3>
          <pre className="p-4 rounded-xl text-xs shadow-inner h-[280px] overflow-y-auto whitespace-pre-wrap flex flex-col-reverse"
            style={{ background: '#0a0a0a', color: '#4ade80', border: '1px solid #1f2937', fontFamily: 'var(--font-mono)' }}>
            <div>
              {streamedRawText || 'Connecting to AI stream...'}
              <span className="animate-pulse">_</span>
            </div>
          </pre>
        </div>
      )}

      {/* Score + Summary Row */}
      {review.overall_score !== null && (
        <div className="grid lg:grid-cols-4 gap-4 mb-6">
          {/* Score gauge */}
          <div className="glass-card p-6 flex flex-col items-center justify-center">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-bg-hover)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="8"
                  strokeDasharray={`${score * 2.64} 264`} strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease-out' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: scoreColor }}>{score}</span>
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>Quality Score</p>
          </div>

          {/* Summary */}
          <div className="lg:col-span-3 glass-card p-6 flex flex-col justify-center">
            {review.summary && (
              <p className="text-base mb-5" style={{ color: 'var(--color-text-primary)', lineHeight: 1.7, fontWeight: 400 }}>{review.summary}</p>
            )}

            {/* Issue type counts */}
            <div className="flex flex-wrap gap-3 mb-5">
              {Object.entries(typeCounts).map(([type, count]) => {
                const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.bug;
                return (
                  <button key={type} onClick={() => setFilterType(filterType === type ? null : type)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: filterType === type ? `${cfg.color}20` : 'var(--color-bg-elevated)',
                      color: filterType === type ? cfg.color : 'var(--color-text-primary)',
                      border: `1px solid ${filterType === type ? `${cfg.color}50` : 'var(--color-border-hover)'}`,
                      boxShadow: filterType === type ? `0 0 10px ${cfg.color}20` : 'none'
                    }}>
                    <cfg.icon size={16} /> {cfg.label}: {count as number}
                  </button>
                );
              })}
            </div>

            {/* Positives */}
            {review.positives?.length > 0 && (
              <div className="space-y-2 mt-2 bg-green-950/10 p-4 rounded-xl border border-green-900/30">
                {review.positives.map((p: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm font-medium" style={{ color: '#4ade80' }}>
                    <CheckCircle size={16} className="mt-0.5 shrink-0" /> {p}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editor + Comments */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* File tabs + Monaco Editor */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          {/* File tabs */}
          <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {review.files?.map((file: any, idx: number) => (
              <button key={file.id} onClick={() => setActiveFile(idx)}
                className="px-5 py-3 text-sm font-medium whitespace-nowrap transition-all shrink-0"
                style={{
                  background: idx === activeFile ? 'var(--color-bg-hover)' : 'transparent',
                  color: idx === activeFile ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  borderBottom: idx === activeFile ? '2px solid var(--color-accent-start)' : '2px solid transparent',
                }}>
                <FileCode size={16} className="inline mr-2 -mt-0.5" />
                {file.file_path.split('/').pop()}
                {file.comments?.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: '#ef444420', color: '#ef4444' }}>
                    {file.comments.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Monaco Editor */}
          <div className="h-[500px]">
            {currentFile ? (
              <Editor
                height="100%"
                language={currentFile.language || 'javascript'}
                value={currentFile.content}
                theme="vs-dark"
                onMount={handleEditorDidMount}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'none',
                  glyphMargin: true,
                  folding: true,
                  wordWrap: 'on',
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No file selected</p>
              </div>
            )}
          </div>
        </div>

        {/* Comments panel */}
        <div className="glass-card p-5 overflow-y-auto max-h-[580px]">
          <h3 className="text-base font-semibold mb-5" style={{ color: 'var(--color-text-primary)' }}>
            Issues ({filteredComments.length})
          </h3>

          {filteredComments.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={24} className="mx-auto mb-2" style={{ color: '#22c55e' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {review.status === 'processing' ? 'AI is analyzing...' : 'No issues found!'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment: any) => {
                const typeConfig = TYPE_CONFIG[comment.type] || TYPE_CONFIG.bug;
                const severityConfig = SEVERITY_CONFIG[comment.severity] || SEVERITY_CONFIG.info;
                const isExpanded = expandedComment === comment.id;

                return (
                  <div key={comment.id}
                    className="rounded-xl overflow-hidden transition-all duration-200"
                    style={{ 
                      background: isExpanded ? 'var(--color-bg-elevated)' : 'var(--color-bg-hover)', 
                      border: `1px solid ${isExpanded ? typeConfig.color : typeConfig.color + '40'}`,
                      boxShadow: isExpanded ? `0 4px 20px ${typeConfig.color}15` : 'none'
                    }}>
                    <button onClick={() => setExpandedComment(isExpanded ? null : comment.id)}
                      className="w-full p-4 text-left">
                      <div className="flex items-start gap-3">
                        <typeConfig.icon size={18} className="mt-0.5 shrink-0" style={{ color: typeConfig.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded capitalize"
                              style={{ background: `${severityConfig.color}20`, color: severityConfig.color }}>
                              {comment.severity}
                            </span>
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Line {comment.line_number}</span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                            {comment.message}
                          </p>
                        </div>
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${typeConfig.color}20` }}>
                        {comment.suggestion && (
                          <div className="flex items-start gap-2 pt-3">
                            <Lightbulb size={16} className="mt-0.5 shrink-0" style={{ color: '#eab308' }} />
                            <p className="text-sm" style={{ color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                              {comment.suggestion}
                            </p>
                          </div>
                        )}
                        {comment.improved_code && (
                          <pre className="p-3 rounded-lg text-sm overflow-x-auto mt-2 shadow-inner"
                            style={{ background: '#000000', color: '#4ade80', border: '1px solid #1f2937', fontFamily: 'var(--font-mono)' }}>
                            {comment.improved_code}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
