'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Shield, Zap, GitBranch, Users, BarChart3, Code2,
  ArrowRight, CheckCircle2, ChevronRight, Eye
} from 'lucide-react';

/* ── Animated code demo lines ── */
const DEMO_LINES = [
  { num: 1, code: 'async function fetchUsers(db) {', issues: [] },
  { num: 2, code: '  const query = "SELECT * FROM users WHERE id = " + userId;', issues: [{ type: 'security', msg: 'SQL Injection — use parameterized queries' }] },
  { num: 3, code: '  const result = await db.query(query);', issues: [] },
  { num: 4, code: '  return result;', issues: [] },
  { num: 5, code: '}', issues: [] },
  { num: 6, code: '', issues: [] },
  { num: 7, code: 'function processData(data) {', issues: [] },
  { num: 8, code: '  for (var i = 0; i < data.length; i++) {', issues: [{ type: 'style', msg: 'Use let/const instead of var' }] },
  { num: 9, code: '    console.log(data[i]);', issues: [{ type: 'performance', msg: 'Remove console.log in production' }] },
  { num: 10, code: '  }', issues: [] },
  { num: 11, code: '}', issues: [] },
];

const FEATURES = [
  { icon: Zap, title: 'Instant Feedback', desc: 'Line-by-line AI analysis in seconds. No waiting, no context switching.' },
  { icon: Shield, title: 'Security Scanning', desc: 'Catches injections, XSS, SSRF, and auth flaws before they ship.' },
  { icon: BarChart3, title: 'Quality Scoring', desc: 'Quantified 0–100 scores for correctness, style, and maintainability.' },
  { icon: GitBranch, title: 'GitHub Native', desc: 'One-click repo connection. Review any file from any branch.' },
  { icon: Users, title: 'Team Reviews', desc: 'Human + AI reviews side by side. Comment on specific lines of code.' },
  { icon: Code2, title: 'Monaco Editor', desc: 'VS Code-grade editor with inline annotations and syntax highlighting.' },
];

/* ── Floating orb component ── */
function MetallicOrb({ className, delay = '0s' }: { className?: string; delay?: string }) {
  return (
    <div
      className={`absolute rounded-full animate-float ${className}`}
      style={{
        animationDelay: delay,
        background: 'radial-gradient(circle at 35% 35%, rgba(137,137,137,0.08), rgba(67,67,67,0.03), transparent 70%)',
        filter: 'blur(1px)',
      }}
    />
  );
}

export default function LandingPage() {
  const [visibleIssues, setVisibleIssues] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleIssues((prev) => (prev < 3 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#030303' }}>

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {/* Top ellipse */}
        <div
          className="absolute"
          style={{
            top: '-20%', left: '50%', transform: 'translateX(-50%)',
            width: '120%', height: '600px',
            background: 'radial-gradient(ellipse at center, rgba(137,137,137,0.04) 0%, transparent 70%)',
          }}
        />
        {/* Bottom vignette */}
        <div
          className="absolute inset-x-0 bottom-0 h-64"
          style={{ background: 'linear-gradient(to top, #030303, transparent)' }}
        />
      </div>

      {/* ── Navigation ── */}
      <nav
        className="fixed top-0 w-full z-50 transition-all duration-500"
        style={{
          background: scrollY > 20 ? 'rgba(3,3,3,0.85)' : 'transparent',
          backdropFilter: scrollY > 20 ? 'blur(20px) saturate(1.4)' : 'none',
          borderBottom: scrollY > 20 ? '1px solid rgba(46,46,46,0.5)' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span
              className="text-xl tracking-[0.35em] font-light"
              style={{ color: '#898989' }}
            >
              VANTA
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-xs tracking-widest uppercase transition-colors duration-300"
              style={{ color: '#616161' }}
              onMouseEnter={e => e.currentTarget.style.color = '#898989'}
              onMouseLeave={e => e.currentTarget.style.color = '#616161'}
            >
              Features
            </a>
            <Link href="/login"
              className="btn-metal px-5 py-2 rounded-lg text-xs font-medium tracking-wider uppercase"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          HERO SECTION
         ═══════════════════════════════════════════ */}
      <section ref={heroRef} className="relative pt-40 pb-32 px-6" style={{ zIndex: 1 }}>
        {/* Floating orbs for depth */}
        <MetallicOrb className="w-72 h-72 -top-10 -right-20 opacity-60" delay="0s" />
        <MetallicOrb className="w-48 h-48 top-1/3 -left-16 opacity-40" delay="2s" />
        <MetallicOrb className="w-36 h-36 bottom-20 right-1/4 opacity-30" delay="4s" />

        <div className="max-w-6xl mx-auto relative">
          <div className="flex flex-col items-center text-center">

            {/* Badge */}
            <div
              className="animate-hero-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-wider uppercase mb-10"
              style={{
                background: 'rgba(137,137,137,0.06)',
                border: '1px solid rgba(137,137,137,0.12)',
                color: '#898989',
                animationDelay: '0.1s',
              }}
            >
              <Eye size={12} />
              AI-Powered Code Intelligence
            </div>

            {/* Title */}
            <h1
              className="animate-hero-reveal text-7xl md:text-8xl lg:text-9xl font-extralight tracking-[0.15em] mb-8"
              style={{
                animationDelay: '0.25s',
                background: 'linear-gradient(180deg, #ffffff 0%, #898989 45%, #494949 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '0.2em',
              }}
            >
              VANTA
            </h1>

            {/* Tagline */}
            <p
              className="animate-hero-reveal text-lg md:text-xl font-light max-w-xl mb-6"
              style={{
                animationDelay: '0.4s',
                color: '#8B8B8B',
                lineHeight: 1.8,
              }}
            >
              Push code. Get expert-level feedback in seconds.
            </p>
            <p
              className="animate-hero-reveal text-sm font-light max-w-lg mb-14"
              style={{
                animationDelay: '0.5s',
                color: '#616161',
                lineHeight: 1.8,
              }}
            >
              Detect bugs, security vulnerabilities, and performance issues — 
              before they reach production. One platform, zero friction.
            </p>

            {/* CTA Buttons */}
            <div className="animate-hero-reveal flex items-center gap-4 mb-20" style={{ animationDelay: '0.6s' }}>
              <Link href="/login"
                className="btn-metal px-8 py-3.5 rounded-xl text-sm font-medium tracking-wider uppercase flex items-center gap-3"
              >
                Start Reviewing
                <ArrowRight size={14} />
              </Link>
              <a href="#features"
                className="px-8 py-3.5 rounded-xl text-sm font-medium tracking-wider transition-all duration-300"
                style={{
                  color: '#616161',
                  border: '1px solid rgba(46,46,46,0.5)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#898989';
                  e.currentTarget.style.borderColor = 'rgba(65,65,65,0.8)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#616161';
                  e.currentTarget.style.borderColor = 'rgba(46,46,46,0.5)';
                }}
              >
                See How It Works
              </a>
            </div>

            {/* Stats */}
            <div
              className="animate-hero-reveal flex items-center gap-12 md:gap-16"
              style={{ animationDelay: '0.7s' }}
            >
              {[
                { value: '10×', label: 'Faster' },
                { value: '95%', label: 'Detection' },
                { value: '50+', label: 'Languages' },
                { value: '24/7', label: 'Always On' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-extralight tracking-wider gradient-text-bright">{stat.value}</div>
                  <div className="text-[10px] tracking-[0.2em] uppercase mt-1" style={{ color: '#616161' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Separator line ── */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto h-px" style={{
          background: 'linear-gradient(90deg, transparent, rgba(137,137,137,0.15), transparent)',
        }} />
      </div>

      {/* ═══════════════════════════════════════════
          CODE DEMO SECTION
         ═══════════════════════════════════════════ */}
      <section className="relative py-28 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-extralight tracking-wider mb-4" style={{ color: '#e8e8e8' }}>
              See it in action
            </h2>
            <p className="text-sm font-light" style={{ color: '#616161' }}>
              Real-time AI analysis as you push your code
            </p>
          </div>

          <div className="metal-card overflow-hidden noise relative max-w-3xl mx-auto" style={{ animationDelay: '0.2s' }}>
            {/* Editor chrome */}
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#414141' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#333333' }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#2E2E2E' }} />
                </div>
                <span className="text-[11px] ml-3 tracking-wider" style={{ color: '#616161' }}>api/users.js</span>
              </div>
              <span className="text-[10px] tracking-widest uppercase" style={{ color: '#494949' }}>Reviewing...</span>
            </div>

            {/* Code block */}
            <div className="px-5 py-4 text-[13px] leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>
              {DEMO_LINES.map((line, idx) => {
                const hasIssue = line.issues.length > 0;
                const issueIdx = DEMO_LINES.slice(0, idx + 1).filter(l => l.issues.length > 0).length;
                const showIssue = hasIssue && issueIdx <= visibleIssues;

                return (
                  <div key={line.num}>
                    <div
                      className="flex items-start transition-all duration-500"
                      style={{
                        background: showIssue ? 'rgba(248,113,113,0.04)' : 'transparent',
                        margin: '0 -20px',
                        padding: '3px 20px',
                        borderLeft: showIssue ? '2px solid rgba(248,113,113,0.3)' : '2px solid transparent',
                      }}
                    >
                      <span className="w-8 text-right mr-4 select-none" style={{ color: '#414141' }}>
                        {line.num}
                      </span>
                      <span style={{ color: hasIssue ? '#8B8B8B' : '#616161' }}>
                        {line.code || '\u00A0'}
                      </span>
                    </div>
                    {showIssue && line.issues.map((issue, i) => (
                      <div key={i}
                        className="ml-12 my-1.5 px-3 py-2 rounded-lg text-xs flex items-start gap-2 transition-all duration-700"
                        style={{
                          background: 'rgba(137,137,137,0.04)',
                          border: '1px solid rgba(137,137,137,0.08)',
                          color: issue.type === 'security' ? '#fb923c' : issue.type === 'performance' ? '#facc15' : '#60a5fa',
                        }}
                      >
                        <Shield size={11} className="mt-0.5 shrink-0 opacity-60" />
                        <span className="font-light">{issue.msg}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Score bar */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} style={{ color: '#616161' }} />
                <span className="text-[11px] tracking-wider" style={{ color: '#616161' }}>3 issues detected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] tracking-wider" style={{ color: '#494949' }}>Score</span>
                <span className="text-sm font-light tracking-wider" style={{ color: '#898989' }}>62<span style={{ color: '#494949' }}>/100</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Separator ── */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto h-px" style={{
          background: 'linear-gradient(90deg, transparent, rgba(137,137,137,0.15), transparent)',
        }} />
      </div>

      {/* ═══════════════════════════════════════════
          FEATURES SECTION
         ═══════════════════════════════════════════ */}
      <section id="features" className="relative py-28 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-2xl md:text-3xl font-extralight tracking-wider mb-4" style={{ color: '#e8e8e8' }}>
              Built for developers who ship
            </h2>
            <p className="text-sm font-light max-w-md mx-auto" style={{ color: '#616161', lineHeight: 1.8 }}>
              Everything you need for faster, safer, and cleaner code — in one place.
            </p>
          </div>

          <div className="flex flex-col gap-4 max-w-3xl mx-auto stagger">
            {FEATURES.map((feature) => (
              <div key={feature.title}
                className="group flex items-start gap-5 p-6 rounded-2xl transition-all duration-500 cursor-default"
                style={{
                  border: '1px solid transparent',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(137,137,137,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(46,46,46,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500"
                  style={{
                    background: 'rgba(137,137,137,0.06)',
                    border: '1px solid rgba(137,137,137,0.08)',
                    color: '#898989',
                  }}
                >
                  <feature.icon size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-medium tracking-wider mb-1.5" style={{ color: '#e8e8e8' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm font-light" style={{ color: '#616161', lineHeight: 1.7 }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Separator ── */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto h-px" style={{
          background: 'linear-gradient(90deg, transparent, rgba(137,137,137,0.15), transparent)',
        }} />
      </div>

      {/* ═══════════════════════════════════════════
          CTA SECTION
         ═══════════════════════════════════════════ */}
      <section className="relative py-32 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extralight tracking-wider mb-6"
            style={{ color: '#e8e8e8' }}>
            Ship better code,{' '}
            <span className="gradient-text-bright">today</span>
          </h2>
          <p className="text-sm font-light mb-10" style={{ color: '#616161', lineHeight: 1.8 }}>
            Connect your GitHub account and get your first AI review in under 60 seconds.
          </p>
          <Link href="/login"
            className="btn-metal inline-flex items-center gap-3 px-8 py-3.5 rounded-xl text-sm font-medium tracking-wider uppercase"
          >
            <GitBranch size={16} strokeWidth={1.5} />
            Connect GitHub
            <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
         ═══════════════════════════════════════════ */}
      <footer className="relative py-10 px-6" style={{ zIndex: 1, borderTop: '1px solid rgba(46,46,46,0.3)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xs tracking-[0.3em] font-light" style={{ color: '#414141' }}>VANTA</span>
          <span className="text-[10px] tracking-wider" style={{ color: '#333333' }}>Built for developers</span>
        </div>
      </footer>
    </div>
  );
}
