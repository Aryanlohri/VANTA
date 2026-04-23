'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Shield, Zap, GitBranch, Users, BarChart3, Code2,
  ArrowRight, Star, CheckCircle2, Sparkles
} from 'lucide-react';

const FEATURES = [
  { icon: Zap, title: 'Instant AI Reviews', desc: 'Get line-by-line feedback in seconds, powered by GPT-4o', color: '#6366f1' },
  { icon: Shield, title: 'Security Analysis', desc: 'Detect vulnerabilities, injections, and security anti-patterns', color: '#f97316' },
  { icon: BarChart3, title: 'Code Quality Score', desc: 'Get a 0-100 score based on correctness, security, and style', color: '#22c55e' },
  { icon: GitBranch, title: 'GitHub Integration', desc: 'Connect your repos with one click. Review any file, any branch', color: '#3b82f6' },
  { icon: Users, title: 'Team Collaboration', desc: 'Human + AI reviews side by side. Comment on specific lines', color: '#8b5cf6' },
  { icon: Code2, title: 'Monaco Editor', desc: 'Same editor as VS Code. Inline annotations, syntax highlighting', color: '#ec4899' },
];

const STATS = [
  { value: '10x', label: 'Faster Reviews' },
  { value: '95%', label: 'Bug Detection' },
  { value: '50+', label: 'Languages' },
  { value: '24/7', label: 'Always Available' },
];

// Animated code review demo text
const DEMO_LINES = [
  { num: 1, code: 'async function fetchUsers(db) {', issues: [] },
  { num: 2, code: '  const query = "SELECT * FROM users WHERE id = " + userId;', issues: [{ type: 'security', msg: 'SQL Injection vulnerability' }] },
  { num: 3, code: '  const result = await db.query(query);', issues: [] },
  { num: 4, code: '  return result;', issues: [] },
  { num: 5, code: '}', issues: [] },
  { num: 6, code: '', issues: [] },
  { num: 7, code: 'function processData(data) {', issues: [] },
  { num: 8, code: '  for (var i = 0; i < data.length; i++) {', issues: [{ type: 'style', msg: 'Use let/const instead of var' }] },
  { num: 9, code: '    console.log(data[i]);', issues: [{ type: 'performance', msg: 'Console.log in production code' }] },
  { num: 10, code: '  }', issues: [] },
  { num: 11, code: '}', issues: [] },
];

export default function LandingPage() {
  const [visibleIssues, setVisibleIssues] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleIssues((prev) => (prev < 3 ? prev + 1 : prev));
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b" style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(12px)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))' }}>
              <Sparkles size={18} color="white" />
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>CodeLens AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login"
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))',
                color: 'white',
              }}
            >
              Get Started <ArrowRight size={14} className="inline ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Text */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
                style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent-start)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Star size={12} /> Powered by GPT-4o
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: 'var(--color-text-primary)' }}>
                AI Code Reviews,{' '}
                <span className="gradient-text">Instantly.</span>
              </h1>

              <p className="text-lg mb-8 max-w-lg" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                Push your code. Get expert-level feedback in seconds. Detect bugs, security vulnerabilities, 
                and performance issues — before they reach production.
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <Link href="/login"
                  className="px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 hover:scale-105 glow"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))',
                    color: 'white',
                  }}
                >
                  Start Free Review <ArrowRight size={16} className="inline ml-2" />
                </Link>
                <a href="#features"
                  className="px-8 py-3.5 rounded-xl text-base font-medium transition-all duration-200 hover:bg-opacity-80"
                  style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                >
                  See How It Works
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-6">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Code Demo */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="glass-card overflow-hidden">
                {/* Editor header */}
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
                  </div>
                  <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>api/users.js — AI Review</span>
                </div>

                {/* Code */}
                <div className="p-4 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                  {DEMO_LINES.map((line, idx) => {
                    const hasIssue = line.issues.length > 0;
                    const issueIdx = DEMO_LINES.slice(0, idx + 1).filter(l => l.issues.length > 0).length;
                    const showIssue = hasIssue && issueIdx <= visibleIssues;

                    return (
                      <div key={line.num}>
                        <div className="flex items-start" style={{
                          background: showIssue ? 'rgba(239,68,68,0.08)' : 'transparent',
                          margin: '0 -16px',
                          padding: '2px 16px',
                          borderLeft: showIssue ? '3px solid var(--color-error)' : '3px solid transparent',
                        }}>
                          <span className="w-8 text-right mr-4 select-none" style={{ color: 'var(--color-text-muted)' }}>
                            {line.num}
                          </span>
                          <span style={{ color: hasIssue ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                            {line.code || '\u00A0'}
                          </span>
                        </div>
                        {showIssue && line.issues.map((issue, i) => (
                          <div key={i}
                            className="ml-12 my-1 px-3 py-2 rounded-lg text-xs flex items-start gap-2 transition-all duration-500"
                            style={{
                              background: issue.type === 'security' ? 'rgba(249,115,22,0.1)' : issue.type === 'performance' ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.1)',
                              border: `1px solid ${issue.type === 'security' ? 'rgba(249,115,22,0.2)' : issue.type === 'performance' ? 'rgba(234,179,8,0.2)' : 'rgba(59,130,246,0.2)'}`,
                              color: issue.type === 'security' ? '#f97316' : issue.type === 'performance' ? '#eab308' : '#3b82f6',
                              opacity: showIssue ? 1 : 0,
                              transform: showIssue ? 'translateY(0)' : 'translateY(-8px)',
                            }}>
                            <Shield size={12} className="mt-0.5 shrink-0" />
                            <span>{issue.msg}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Score bar */}
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} style={{ color: 'var(--color-warning)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>3 issues found</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Score:</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-warning)' }}>62/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Everything You Need for <span className="gradient-text">Better Code</span>
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              From instant AI analysis to team collaboration — one platform for all your code review needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {FEATURES.map((feature) => (
              <div key={feature.title}
                className="glass-card p-6 transition-all duration-300 hover:scale-[1.02] cursor-default group"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${feature.color}15`, color: feature.color }}>
                  <feature.icon size={20} />
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Ready to Ship <span className="gradient-text">Better Code</span>?
          </h2>
          <p className="text-base mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Connect your GitHub account and get your first AI review in under 60 seconds.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 hover:scale-105 glow"
            style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))', color: 'white' }}
          >
            <GitBranch size={18} /> Connect GitHub & Start
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--color-accent-start)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>CodeLens AI</span>
          </div>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Built with ❤️ for developers</span>
        </div>
      </footer>
    </div>
  );
}
