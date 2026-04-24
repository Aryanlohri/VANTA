'use client';

import { useEffect, useState, useRef, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import {
  Shield, Zap, GitBranch, Users, BarChart3, Code2,
  ArrowRight, CheckCircle2, ChevronRight, Eye, Sparkles
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
  { icon: Sparkles, title: 'Auto-Fix Suggestions', desc: 'AI-generated fix recommendations with one-click apply. Ship cleaner code, faster.' },
  { icon: GitBranch, title: 'CI/CD Pipeline', desc: 'Trigger reviews on every push. Blocks merges until critical issues are resolved.' },
];



export default function LandingPage() {
  const [visibleIssues, setVisibleIssues] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const starfieldRef = useRef<HTMLCanvasElement>(null);

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

  /* ── Stat counter animation ── */
  const statsAnimated = useRef(false);
  const animateCounters = useCallback(() => {
    if (statsAnimated.current) return;
    statsAnimated.current = true;
    const counters = document.querySelectorAll<HTMLElement>('[data-target]');
    counters.forEach(counter => {
      const target = parseFloat(counter.dataset.target || '0');
      const suffix = counter.dataset.suffix || '';
      const prefix = counter.dataset.prefix || '';
      const isFloat = (counter.dataset.target || '').includes('.');
      const duration = 1800;
      const startTime = performance.now();

      function update(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        counter.textContent = prefix +
          (isFloat ? current.toFixed(1) : Math.floor(current).toString()) +
          suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    });
  }, []);

  useEffect(() => {
    const statsStrip = document.querySelector('.hero-stats');
    if (!statsStrip) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });
    observer.observe(statsStrip);
    return () => observer.disconnect();
  }, [animateCounters]);

  /* ── Living star field — cold palette, shooting stars, multi-oscillator twinkle ── */
  useEffect(() => {
    const canvas = starfieldRef.current;
    const hero = heroRef.current;
    if (!canvas || !hero) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const STAR_COUNT = 160;
    const MAX_DRIFT = 0.055;
    const CONNECT_DIST = 88;
    const CONST_FADE_IN = 1400;
    const CONST_HOLD = 3000;
    const CONST_FADE_OUT = 2000;
    const BRIGHTEN_DURATION = 2800;

    let W = 0, H = 0;
    let animId: number;
    const timerIds: ReturnType<typeof setTimeout>[] = [];

    // Cold star color types — strictly no warm tones
    const STAR_TYPES = [
      { r: 200, g: 215, b: 255, weight: 0.12 }, // blue-white — rare, hot
      { r: 218, g: 224, b: 238, weight: 0.22 }, // blue-tinted white
      { r: 230, g: 232, b: 235, weight: 0.35 }, // pure white — most common
      { r: 205, g: 210, b: 220, weight: 0.20 }, // cool white
      { r: 175, g: 182, b: 198, weight: 0.11 }, // ice dim — faint far stars
    ];

    function pickStarType() {
      const roll = Math.random();
      let cumulative = 0;
      for (const t of STAR_TYPES) {
        cumulative += t.weight;
        if (roll < cumulative) return t;
      }
      return STAR_TYPES[2];
    }

    interface StarType { r: number; g: number; b: number; weight: number }

    interface Star {
      x: number; y: number; vx: number; vy: number;
      baseR: number; baseOpacity: number;
      type: StarType;
      t1Phase: number; t1Speed: number; t1Amp: number;
      t2Phase: number; t2Speed: number; t2Amp: number;
      t3Phase: number; t3Speed: number; t3Amp: number;
      twinkleMult: number;
      brightenState: number; brightenT: number;
      constellationGlow: number;
    }

    interface ActiveConst {
      edges: [number, number][];
      opacity: number;
      phase: 'fadein' | 'hold' | 'fadeout';
      elapsed: number;
    }

    interface Shooter {
      x: number; y: number;
      vx: number; vy: number;
      life: number; maxLife: number;
      tailPoints: Array<{ x: number; y: number }>;
    }

    let stars: Star[] = [];
    let activeConst: ActiveConst | null = null;
    let shooters: Shooter[] = [];
    let lastTime = 0;

    function resize() {
      W = canvas!.width = hero!.offsetWidth;
      H = canvas!.height = hero!.offsetHeight;
    }

    function createStars() {
      stars = Array.from({ length: STAR_COUNT }, () => {
        const sizeSeed = Math.random();
        const type = pickStarType();
        const baseR = sizeSeed < 0.55 ? 0.38
          : sizeSeed < 0.80 ? 0.72
            : sizeSeed < 0.94 ? 1.08 : 1.55;
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * MAX_DRIFT * 2,
          vy: (Math.random() - 0.5) * MAX_DRIFT * 2,
          baseR,
          baseOpacity: 0.18 + Math.random() * 0.52,
          type,
          // Three-oscillator twinkle system
          t1Phase: Math.random() * Math.PI * 2,
          t1Speed: 0.022 + Math.random() * 0.018,
          t1Amp: 0.06 + Math.random() * 0.08,
          t2Phase: Math.random() * Math.PI * 2,
          t2Speed: 0.051 + Math.random() * 0.034,
          t2Amp: 0.03 + Math.random() * 0.05,
          t3Phase: Math.random() * Math.PI * 2,
          t3Speed: 0.089 + Math.random() * 0.061,
          t3Amp: 0.015 + Math.random() * 0.025,
          twinkleMult: baseR > 0.7 ? 1.0 : 0.35,
          brightenState: 0,
          brightenT: 0,
          constellationGlow: 0,
        };
      });
    }

    function findConstellation(): ActiveConst | null {
      const seed = Math.floor(Math.random() * stars.length);
      const cluster = [seed];
      const maxSize = 4 + Math.floor(Math.random() * 4);

      for (let i = 0; i < stars.length && cluster.length < maxSize; i++) {
        if (i === seed) continue;
        const dx = stars[i].x - stars[seed].x;
        const dy = stars[i].y - stars[seed].y;
        if (Math.sqrt(dx * dx + dy * dy) < CONNECT_DIST * 1.5) {
          cluster.push(i);
        }
      }

      if (cluster.length < 3) return null;

      const edges: [number, number][] = [];
      const used = new Set<number>([cluster[0]]);
      let current = cluster[0];

      while (used.size < cluster.length) {
        let nearestDist = Infinity, nearest = -1;
        for (const idx of cluster) {
          if (used.has(idx)) continue;
          const dx = stars[current].x - stars[idx].x;
          const dy = stars[current].y - stars[idx].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < nearestDist) { nearestDist = d; nearest = idx; }
        }
        if (nearest === -1) break;
        edges.push([current, nearest]);
        used.add(nearest);
        current = nearest;
      }

      return { edges, opacity: 0, phase: 'fadein', elapsed: 0 };
    }

    function createShooter(): Shooter {
      const angle = (Math.random() * 40 + 20) * (Math.PI / 180);
      return {
        x: Math.random() * W * 0.7,
        y: Math.random() * H * 0.4,
        vx: Math.cos(angle) * (3.5 + Math.random() * 2.5),
        vy: Math.sin(angle) * (3.5 + Math.random() * 2.5),
        life: 0,
        maxLife: 0.42 + Math.random() * 0.18,
        tailPoints: [],
      };
    }

    function scheduleShooter() {
      const delay = 8000 + Math.random() * 7000;
      const id = setTimeout(() => {
        shooters.push(createShooter());
        scheduleShooter();
      }, delay);
      timerIds.push(id);
    }

    function scheduleBrighten() {
      const delay = 1800 + Math.random() * 1700;
      const id = setTimeout(() => {
        const candidates = stars.filter(s => s.baseR >= 0.72 && s.brightenState === 0);
        if (candidates.length > 0) {
          const star = candidates[Math.floor(Math.random() * candidates.length)];
          star.brightenState = 1;
          star.brightenT = 0;
        }
        scheduleBrighten();
      }, delay);
      timerIds.push(id);
    }

    function scheduleConstellation() {
      const delay = 4500 + Math.random() * 2500;
      const id = setTimeout(() => {
        if (!activeConst) activeConst = findConstellation();
        scheduleConstellation();
      }, delay);
      timerIds.push(id);
    }

    function draw(now: number) {
      const dt = Math.min(lastTime ? now - lastTime : 16, 50);
      lastTime = now;

      ctx!.clearRect(0, 0, W, H);

      // Draw constellation lines — sequential trace animation
      if (activeConst) {
        const ac = activeConst;
        ac.elapsed += dt;

        const DRAW_TIME_PER_LINE = 420;
        const totalDrawTime = ac.edges.length * DRAW_TIME_PER_LINE;

        if (ac.phase === 'fadein') {
          if (ac.elapsed >= totalDrawTime) {
            ac.phase = 'hold';
            ac.elapsed = 0;
          }
        } else if (ac.phase === 'hold') {
          if (ac.elapsed >= CONST_HOLD) {
            ac.phase = 'fadeout';
            ac.elapsed = 0;
          }
        } else if (ac.phase === 'fadeout') {
          ac.opacity = Math.max(1 - ac.elapsed / CONST_FADE_OUT, 0);
          if (ac.elapsed >= CONST_FADE_OUT) activeConst = null;
        }

        if (activeConst) {
          ac.edges.forEach(([a, b], i) => {
            const lineStart = i * DRAW_TIME_PER_LINE;

            let drawProgress = 0;
            let lineOpacity = 0;

            if (ac.phase === 'fadein') {
              if (ac.elapsed >= lineStart) {
                drawProgress = Math.min(
                  (ac.elapsed - lineStart) / DRAW_TIME_PER_LINE,
                  1
                );
                lineOpacity = drawProgress;
              }
            } else if (ac.phase === 'hold') {
              drawProgress = 1;
              lineOpacity = 1;
            } else if (ac.phase === 'fadeout') {
              drawProgress = 1;
              lineOpacity = ac.opacity;
            }

            if (drawProgress <= 0) return;

            const sx = stars[a].x;
            const sy = stars[a].y;

            const tx = sx + (stars[b].x - sx) * drawProgress;
            const ty = sy + (stars[b].y - sy) * drawProgress;

            ctx!.beginPath();
            ctx!.moveTo(sx, sy);
            ctx!.lineTo(tx, ty);
            ctx!.strokeStyle = `rgba(185, 200, 235, ${lineOpacity * 0.22})`;
            ctx!.lineWidth = 0.55;
            ctx!.stroke();

            // Travelling dot at the drawing tip — only during fadein
            if (ac.phase === 'fadein' && drawProgress > 0 && drawProgress < 1) {
              const dotGrad = ctx!.createRadialGradient(tx, ty, 0, tx, ty, 3.5);
              dotGrad.addColorStop(0, `rgba(210, 225, 255, ${lineOpacity * 0.9})`);
              dotGrad.addColorStop(1, 'rgba(10, 9, 6, 0)');
              ctx!.beginPath();
              ctx!.arc(tx, ty, 3.5, 0, Math.PI * 2);
              ctx!.fillStyle = dotGrad;
              ctx!.fill();
            }

            // Glow constellation stars during hold and fadein
            if (drawProgress >= 1 || ac.phase === 'hold') {
              stars[a].constellationGlow = lineOpacity;
              stars[b].constellationGlow = lineOpacity;
            }
          });
        }
      }

      // Draw shooting stars
      shooters = shooters.filter(s => s.life < s.maxLife);
      shooters.forEach(s => {
        s.life += dt / 1000;
        const progress = s.life / s.maxLife;
        const op = progress < 0.25 ? progress / 0.25 : 1 - ((progress - 0.25) / 0.75);

        s.tailPoints.push({ x: s.x, y: s.y });
        if (s.tailPoints.length > 28) s.tailPoints.shift();

        if (s.tailPoints.length > 1) {
          for (let i = 1; i < s.tailPoints.length; i++) {
            const t = i / s.tailPoints.length;
            ctx!.beginPath();
            ctx!.moveTo(s.tailPoints[i - 1].x, s.tailPoints[i - 1].y);
            ctx!.lineTo(s.tailPoints[i].x, s.tailPoints[i].y);
            ctx!.strokeStyle = `rgba(210, 220, 255, ${t * op * 0.85})`;
            ctx!.lineWidth = t * 1.4;
            ctx!.stroke();
          }
        }

        // Head glow
        const headGrad = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, 5);
        headGrad.addColorStop(0, `rgba(230, 238, 255, ${op * 0.95})`);
        headGrad.addColorStop(1, 'rgba(10, 9, 6, 0)');
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx!.fillStyle = headGrad;
        ctx!.fill();

        s.x += s.vx;
        s.y += s.vy;
      });

      // Draw stars
      stars.forEach(s => {
        // Three-oscillator twinkle
        s.t1Phase += s.t1Speed;
        s.t2Phase += s.t2Speed;
        s.t3Phase += s.t3Speed;

        const twinkle = (
          Math.sin(s.t1Phase) * s.t1Amp +
          Math.sin(s.t2Phase) * s.t2Amp +
          Math.sin(s.t3Phase) * s.t3Amp
        ) * s.twinkleMult;

        // Brighten state machine
        if (s.brightenState === 1) {
          s.brightenT += dt / (BRIGHTEN_DURATION * 0.38);
          if (s.brightenT >= 1) { s.brightenT = 1; s.brightenState = 2; }
        } else if (s.brightenState === 2) {
          s.brightenT -= dt / (BRIGHTEN_DURATION * 0.62);
          if (s.brightenT <= 0) { s.brightenT = 0; s.brightenState = 0; }
        }

        const be = s.brightenT * s.brightenT * (3 - 2 * s.brightenT);
        const cg = s.constellationGlow || 0;
        s.constellationGlow = 0;

        const r = s.baseR + be * s.baseR * 1.9 + cg * 0.35;
        const op = Math.min(
          s.baseOpacity + twinkle + be * 0.6 + cg * 0.18,
          0.92
        );

        const { r: cr, g: cg2, b: cb } = s.type;

        // Halo for brighter stars
        if (r > 0.85 || be > 0.08) {
          const haloR = r * (2.8 + be * 3.2);
          const hg = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloR);
          hg.addColorStop(0, `rgba(${cr}, ${cg2}, ${cb}, ${op * 0.22})`);
          hg.addColorStop(1, 'rgba(10, 9, 6, 0)');
          ctx!.beginPath();
          ctx!.arc(s.x, s.y, haloR, 0, Math.PI * 2);
          ctx!.fillStyle = hg;
          ctx!.fill();
        }

        // Star core
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${cr}, ${cg2}, ${cb}, ${op})`;
        ctx!.fill();

        // Drift
        s.x += s.vx; s.y += s.vy;
        if (s.x < -5) s.x = W + 5;
        if (s.x > W + 5) s.x = -5;
        if (s.y < -5) s.y = H + 5;
        if (s.y > H + 5) s.y = -5;
      });

      animId = requestAnimationFrame(draw);
    }



    function handleResize() {
      resize();
      createStars();
      activeConst = null;
      shooters = [];
    }

    resize();
    createStars();
    scheduleConstellation();
    scheduleBrighten();
    scheduleShooter();

    animId = requestAnimationFrame(draw);

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      timerIds.forEach(id => clearTimeout(id));
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /* ── PHASE 2: Scroll-triggered section reveals ── */
  useEffect(() => {
    const revealElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-stagger');
    if (revealElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ── PHASE 3: Feature card cursor-following glow ── */
  const handleCardMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  /* ── PHASE 4: Magnetic CTA button effect ── */
  const handleMagneticMove = useCallback((e: ReactMouseEvent<HTMLAnchorElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = (x - centerX) / centerX;
    const deltaY = (y - centerY) / centerY;
    btn.style.setProperty('--btn-x', `${x}px`);
    btn.style.setProperty('--btn-y', `${y}px`);
    btn.style.transform = `translate(${deltaX * 4}px, ${deltaY * 3}px)`;
  }, []);

  const handleMagneticLeave = useCallback((e: ReactMouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = 'translate(0, 0)';
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#030303' }}>

      {/* ── Film grain overlay ── */}
      <svg className="grain-overlay" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves={3}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>




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
              className="text-xl font-extralight"
              style={{ color: '#898989', fontFamily: 'var(--font-sans)', letterSpacing: '0.35em' }}
            >
              VANTA
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-xs uppercase transition-colors duration-300"
              style={{ color: '#616161', fontFamily: 'var(--font-sans)', fontWeight: 500, letterSpacing: '0.14em' }}
              onMouseEnter={e => e.currentTarget.style.color = '#898989'}
              onMouseLeave={e => e.currentTarget.style.color = '#616161'}
            >
              Features
            </a>
            <Link href="/pricing" className="text-xs uppercase transition-colors duration-300"
              style={{ color: '#616161', fontFamily: 'var(--font-sans)', fontWeight: 500, letterSpacing: '0.14em' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#898989'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#616161'}
            >
              Pricing
            </Link>
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
      <section ref={heroRef} className="relative pt-40 pb-32 px-6" style={{ zIndex: 1, overflow: 'hidden' }}>
        {/* ── Living star field canvas ── */}
        <canvas ref={starfieldRef} id="starfield-canvas" aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }} />



        <div className="max-w-6xl mx-auto relative" style={{ position: 'relative', zIndex: 1, transform: `translateY(${scrollY * -0.08}px)` }}>
          <div className="flex flex-col items-center text-center">

            {/* Badge / Eyebrow */}
            <div
              className="hero-eyebrow inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs uppercase mb-10"
              style={{
                background: 'rgba(137,137,137,0.06)',
                border: '1px solid rgba(137,137,137,0.12)',
                color: '#898989',
                opacity: 0,
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                letterSpacing: '0.14em',
              }}
            >
              <Eye size={12} />
              AI-Powered Code Intelligence
            </div>

            {/* Title — letter-by-letter blur reveal */}
            <h1
              className="vanta-wordmark text-7xl md:text-8xl lg:text-9xl font-extralight mb-8"
              style={{
                letterSpacing: '0.2em',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {['V', 'A', 'N', 'T', 'A'].map((letter, i) => (
                <span
                  key={i}
                  className="vanta-letter"
                  style={{
                    animationDelay: `${0.40 + i * 0.08}s`,
                    background: 'linear-gradient(180deg, #ffffff 0%, #898989 45%, #494949 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {letter}
                </span>
              ))}
            </h1>

            {/* Tagline */}
            <p
              className="animate-hero-reveal text-lg md:text-xl max-w-xl mb-6"
              style={{
                animationDelay: '0.4s',
                color: '#8B8B8B',
                lineHeight: 1.8,
                fontFamily: 'var(--font-sans)',
                fontWeight: 300,
              }}
            >
              Push code. Get expert-level feedback in seconds.
            </p>
            <p
              className="animate-hero-reveal text-sm max-w-lg mb-14"
              style={{
                animationDelay: '0.5s',
                color: '#616161',
                lineHeight: 1.8,
                fontFamily: 'var(--font-sans)',
                fontWeight: 300,
              }}
            >
              Detect bugs, security vulnerabilities, and performance issues —
              before they reach production. One platform, zero friction.
            </p>

            {/* CTA Buttons */}
            <div className="animate-hero-reveal flex items-center gap-4 mb-20" style={{ animationDelay: '0.6s' }}>
              <Link href="/login"
                className="btn-metal btn-magnetic px-8 py-3.5 rounded-xl text-sm uppercase flex items-center gap-3"
                style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, letterSpacing: '0.08em' }}
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticLeave}
              >
                Start Reviewing
                <ArrowRight size={14} />
              </Link>
              <a href="#features"
                className="px-8 py-3.5 rounded-xl text-sm transition-all duration-300"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 400,
                  letterSpacing: '0.04em',
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

            {/* Stats — animated counters */}
            <div
              className="hero-stats animate-hero-reveal flex items-center gap-12 md:gap-16"
              style={{ animationDelay: '0.7s' }}
            >
              {[
                { target: '10', suffix: '×', prefix: '', label: 'Faster' },
                { target: '95', suffix: '%', prefix: '', label: 'Detection' },
                { target: '50', suffix: '+', prefix: '', label: 'Languages' },
                { target: '24', suffix: '/7', prefix: '', label: 'Always On' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    className="text-2xl md:text-3xl gradient-text-bright"
                    style={{ fontFamily: 'var(--font-sans)', fontWeight: 200, letterSpacing: '0.05em' }}
                    data-target={stat.target}
                    data-suffix={stat.suffix}
                    data-prefix={stat.prefix}
                  >
                    0
                  </div>
                  <div className="text-[10px] uppercase mt-1" style={{ color: '#616161', fontFamily: 'var(--font-sans)', fontWeight: 500, letterSpacing: '0.2em' }}>{stat.label}</div>
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
      <section className="scroll-reveal relative py-28 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl mb-4" style={{ color: '#e8e8e8', fontFamily: 'var(--font-display)', fontWeight: 500, letterSpacing: '-0.02em' }}>
              See it in action
            </h2>
            <p className="text-sm" style={{ color: '#616161', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
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
          FEATURES SECTION — Bento Grid
         ═══════════════════════════════════════════ */}
      <section id="features" className="scroll-reveal relative py-28 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center">
            <div style={{
              fontSize: '10px',
              letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.2)',
              marginBottom: '14px',
              textTransform: 'uppercase' as const,
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
            }}>
              Features
            </div>
            <h2 className="text-2xl md:text-3xl mb-4" style={{ color: '#e8e8e8', fontFamily: 'var(--font-display)', fontWeight: 500, letterSpacing: '-0.02em', fontSize: '26px' }}>
              Built for developers who ship
            </h2>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.25)',
              marginBottom: '36px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 300,
            }}>
              Everything you need for faster, safer, and cleaner code — in one place.
            </p>
          </div>

          {/* Bento grid */}
          <div className="scroll-reveal-stagger" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: 'rgba(255, 255, 255, 0.07)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="bento-card"
                onMouseMove={handleCardMouseMove}
                style={{
                  background: '#080808',
                  padding: '22px 20px',
                  position: 'relative',
                  ...(i === 0 ? { gridColumn: 'span 2' } : {}),
                }}
              >
                {/* CORE badge — only on first card */}
                {i === 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    fontSize: '9px',
                    letterSpacing: '0.09em',
                    color: 'rgba(255,255,255,0.18)',
                    border: '0.5px solid rgba(255,255,255,0.07)',
                    borderRadius: '20px',
                    padding: '2px 8px',
                    textTransform: 'uppercase' as const,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                  }}>
                    Core
                  </span>
                )}

                {/* Icon box */}
                <div className="bento-icon" style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '7px',
                  background: 'rgba(255,255,255,0.045)',
                  border: '0.5px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  transition: 'all 0.4s ease',
                  position: 'relative',
                  zIndex: 2,
                }}>
                  <feature.icon size={13} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.38)', transition: 'color 0.4s ease' }} />
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.68)',
                  marginBottom: '5px',
                  fontFamily: 'var(--font-sans)',
                  position: 'relative',
                  zIndex: 2,
                  transition: 'color 0.4s ease',
                }}>
                  {feature.title}
                </h3>

                {/* Body */}
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.25)',
                  lineHeight: 1.6,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 300,
                  position: 'relative',
                  zIndex: 2,
                  transition: 'color 0.4s ease',
                }}>
                  {feature.desc}
                </p>

                {/* Ghost stat — only on first card */}
                {i === 0 && (
                  <div style={{
                    fontSize: '30px',
                    fontWeight: 200,
                    color: 'rgba(255,255,255,0.06)',
                    letterSpacing: '-0.03em',
                    marginTop: '10px',
                    fontFamily: 'var(--font-sans)',
                  }}>
                    0.3s
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ═══════════════════════════════════════════
          CTA SECTION
         ═══════════════════════════════════════════ */}
      <section className="scroll-reveal relative py-32 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl mb-6"
            style={{ color: '#e8e8e8', fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.01em' }}>
            Ship better code,{' '}
            <span className="gradient-text-bright">today</span>
          </h2>
          <p className="text-sm mb-10" style={{ color: '#616161', lineHeight: 1.8, fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
            Connect your GitHub account and get your first AI review in under 60 seconds.
          </p>
          <Link href="/login"
            className="btn-metal btn-magnetic inline-flex items-center gap-3 px-8 py-3.5 rounded-xl text-sm uppercase"
            style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, letterSpacing: '0.08em' }}
            onMouseMove={handleMagneticMove}
            onMouseLeave={handleMagneticLeave}
          >
            <GitBranch size={16} strokeWidth={1.5} />
            Connect GitHub
            <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER — Enhanced
         ═══════════════════════════════════════════ */}
      <footer className="relative py-16 px-6" style={{ zIndex: 1, borderTop: '1px solid rgba(46,46,46,0.3)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <span className="text-sm font-extralight" style={{ color: '#616161', fontFamily: 'var(--font-sans)', letterSpacing: '0.3em' }}>VANTA</span>
              <p className="mt-3 text-[11px]" style={{ color: '#333333', lineHeight: 1.7, fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                AI-powered code intelligence.<br />Ship safer, ship faster.
              </p>
            </div>

            {/* Product column */}
            <div>
              <h4 style={{
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
                color: 'rgba(255,255,255,0.2)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                marginBottom: '12px',
              }}>Product</h4>
              {['Features', 'Pricing', 'Integrations', 'Changelog'].map(item => (
                <a key={item} href="#" className="block text-[11px] mb-2 transition-colors duration-300"
                  style={{ color: '#414141', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#898989'}
                  onMouseLeave={e => e.currentTarget.style.color = '#414141'}
                >{item}</a>
              ))}
            </div>

            {/* Resources column */}
            <div>
              <h4 style={{
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
                color: 'rgba(255,255,255,0.2)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                marginBottom: '12px',
              }}>Resources</h4>
              {['Documentation', 'API Reference', 'Blog', 'Support'].map(item => (
                <a key={item} href="#" className="block text-[11px] mb-2 transition-colors duration-300"
                  style={{ color: '#414141', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#898989'}
                  onMouseLeave={e => e.currentTarget.style.color = '#414141'}
                >{item}</a>
              ))}
            </div>

            {/* Company column */}
            <div>
              <h4 style={{
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
                color: 'rgba(255,255,255,0.2)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                marginBottom: '12px',
              }}>Company</h4>
              {['About', 'Careers', 'Privacy', 'Terms'].map(item => (
                <a key={item} href="#" className="block text-[11px] mb-2 transition-colors duration-300"
                  style={{ color: '#414141', fontFamily: 'var(--font-sans)', fontWeight: 300 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#898989'}
                  onMouseLeave={e => e.currentTarget.style.color = '#414141'}
                >{item}</a>
              ))}
            </div>
          </div>

          {/* Footer bottom bar */}
          <div className="h-px w-full mb-8" style={{
            background: 'linear-gradient(90deg, transparent, rgba(137,137,137,0.1), transparent)',
          }} />
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: '#2E2E2E', fontFamily: 'var(--font-sans)', fontWeight: 300, letterSpacing: '0.06em' }}>
              © {new Date().getFullYear()} VANTA. All rights reserved.
            </span>
            <span className="text-[10px]" style={{ color: '#2E2E2E', fontFamily: 'var(--font-sans)', fontWeight: 300, letterSpacing: '0.06em' }}>
              Built with precision for developers
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
