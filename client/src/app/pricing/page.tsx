'use client';

import { useEffect, useState, useRef, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, Zap, Shield, ChevronRight, Loader2 } from 'lucide-react';
import { initiateCheckout } from '@/lib/razorpay';

const PLANS = [
  {
    name: 'Starter',
    price: { monthly: 0, annual: 0 },
    desc: 'Perfect for trying VANTA on personal projects.',
    badge: null,
    features: [
      '5 reviews / month',
      '1 GitHub repository',
      'JavaScript & Python',
      '200 line file limit',
      '7-day review history',
      'Community support',
    ],
    cta: 'Get Started Free',
    href: '/login',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: { monthly: 1599, annual: 1299 },
    desc: 'For developers who ship daily and need reliable AI reviews.',
    badge: 'Most Popular',
    features: [
      '100 reviews / month',
      'Unlimited repositories',
      'All 50+ languages',
      '800 line file limit',
      'Unlimited review history',
      'Priority review queue',
      'Auto-fix suggestions',
      'Export PDF reports',
    ],
    cta: 'Upgrade to Pro',
    href: '/login',
    highlighted: true,
  },
  {
    name: 'Team',
    price: { monthly: 4099, annual: 3299 },
    desc: 'Built for engineering teams that need collaboration and CI/CD.',
    badge: null,
    features: [
      '500 reviews / seat / month',
      'Unlimited repositories',
      'All 50+ languages',
      'Unlimited file size',
      'Team workspaces',
      'CI/CD pipeline integration',
      'SSO & audit logs',
      'Custom review rules',
      'Slack notifications',
      'Priority support',
    ],
    cta: 'Start Team Trial',
    href: '/login',
    highlighted: false,
  },
];

const FAQ_ITEMS = [
  { q: 'What counts as a review?', a: 'Each file you submit for AI analysis counts as one review. Reviewing the same file again counts as a new review.' },
  { q: 'Can I change plans anytime?', a: 'Yes. Upgrade or downgrade at any time. Changes take effect immediately, with prorated billing.' },
  { q: 'What happens if I exceed my limit?', a: 'You\u2019ll get a notification at 80% usage. After the limit, reviews queue until the next billing cycle, or you can upgrade.' },
  { q: 'Do you offer student discounts?', a: 'Yes! Verify your .edu email for 50% off Pro. We believe in supporting the next generation of developers.' },
  { q: 'Is my code stored or used for training?', a: 'Never. Your code is processed in memory, never stored on disk, and never used to train AI models. Period.' },
];

const COMPARE_FEATURES = [
  { name: 'Monthly reviews', free: '5', pro: '100', team: '500 / seat' },
  { name: 'GitHub repositories', free: '1', pro: 'Unlimited', team: 'Unlimited' },
  { name: 'Languages supported', free: '2', pro: '50+', team: '50+' },
  { name: 'Max file size', free: '200 lines', pro: '800 lines', team: 'Unlimited' },
  { name: 'Review history', free: '7 days', pro: 'Unlimited', team: 'Unlimited' },
  { name: 'Priority queue', free: '\u2014', pro: '\u2713', team: '\u2713' },
  { name: 'Auto-fix suggestions', free: '\u2014', pro: '\u2713', team: '\u2713' },
  { name: 'CI/CD integration', free: '\u2014', pro: '\u2014', team: '\u2713' },
  { name: 'Team workspaces', free: '\u2014', pro: '\u2014', team: '\u2713' },
  { name: 'SSO & audit logs', free: '\u2014', pro: '\u2014', team: '\u2713' },
  { name: 'Custom review rules', free: '\u2014', pro: '\u2014', team: '\u2713' },
  { name: 'Support', free: 'Community', pro: 'Email', team: 'Priority' },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Scroll reveal observer */
  useEffect(() => {
    const els = document.querySelectorAll('.scroll-reveal, .scroll-reveal-stagger');
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Card glow */
  const handleCardGlow = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  /* Magnetic button */
  const handleMagnetic = useCallback((e: ReactMouseEvent<HTMLAnchorElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    btn.style.setProperty('--btn-x', `${x}px`);
    btn.style.setProperty('--btn-y', `${y}px`);
    btn.style.transform = `translate(${((x - rect.width/2) / (rect.width/2)) * 4}px, ${((y - rect.height/2) / (rect.height/2)) * 3}px)`;
  }, []);

  const handleMagLeave = useCallback((e: ReactMouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translate(0,0)';
  }, []);

  /* Handle plan upgrade */
  const handleUpgrade = useCallback(async (planName: string) => {
    if (planName === 'Starter') {
      router.push('/login');
      return;
    }

    // Require authentication before checkout
    const token = typeof window !== 'undefined' ? localStorage.getItem('aicr_token') : null;
    if (!token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('aicr_return_to', '/pricing');
      }
      router.push('/login');
      return;
    }

    const plan = planName.toLowerCase() as 'pro' | 'team';
    setLoading(plan);

    try {
      await initiateCheckout({
        plan,
        billingCycle: isAnnual ? 'annual' : 'monthly',
        onSuccess: (data) => {
          setLoading(null);
          setSuccessMsg(`🎉 ${data.plan.toUpperCase()} plan activated! ${data.reviews_limit} reviews/month.`);
          setTimeout(() => router.push('/dashboard'), 2500);
        },
        onError: (error) => {
          setLoading(null);
          alert(error);
        },
      });
    } catch {
      setLoading(null);
    }
  }, [isAnnual, router]);

  const F = 'var(--font-sans)';
  const FD = 'var(--font-display)';

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#030303' }}>

      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="px-6 py-3 rounded-full flex items-center gap-3" 
            style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', backdropFilter: 'blur(10px)' }}>
            <Check size={14} className="text-green-400" />
            <span className="text-xs text-green-400 font-medium" style={{ fontFamily: F, letterSpacing: '0.05em' }}>
              {successMsg}
            </span>
          </div>
        </div>
      )}

      {/* Film grain */}
      <svg className="grain-overlay" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves={3} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>

      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-500" style={{
        background: scrollY > 20 ? 'rgba(3,3,3,0.85)' : 'transparent',
        backdropFilter: scrollY > 20 ? 'blur(20px) saturate(1.4)' : 'none',
        borderBottom: scrollY > 20 ? '1px solid rgba(46,46,46,0.5)' : '1px solid transparent',
      }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-xl font-extralight" style={{ color: '#898989', fontFamily: F, letterSpacing: '0.35em' }}>VANTA</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/#features" className="text-xs uppercase transition-colors duration-300"
              style={{ color: '#616161', fontFamily: F, fontWeight: 500, letterSpacing: '0.14em' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#898989'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#616161'}
            >Features</Link>
            <span className="text-xs uppercase" style={{ color: '#898989', fontFamily: F, fontWeight: 500, letterSpacing: '0.14em' }}>Pricing</span>
            <Link href="/login" className="btn-metal px-5 py-2 rounded-lg text-xs font-medium tracking-wider uppercase">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-36 pb-10 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs uppercase mb-8"
            style={{ background: 'rgba(137,137,137,0.06)', border: '1px solid rgba(137,137,137,0.12)', color: '#898989', fontFamily: F, fontWeight: 500, letterSpacing: '0.14em' }}>
            <Zap size={12} /> Simple Pricing
          </div>
          <h1 className="text-4xl md:text-5xl mb-5" style={{ fontFamily: FD, fontWeight: 500, letterSpacing: '-0.02em', color: '#e8e8e8' }}>
            One tool. <span className="gradient-text-bright">Zero surprises.</span>
          </h1>
          <p className="text-sm max-w-md mx-auto mb-10" style={{ color: '#616161', lineHeight: 1.8, fontFamily: F, fontWeight: 300 }}>
            Start free. Upgrade when you need more reviews, languages, and team features. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full" style={{ background: 'rgba(137,137,137,0.06)', border: '1px solid rgba(46,46,46,0.5)' }}>
            <button
              onClick={() => setIsAnnual(false)}
              className="px-5 py-2 rounded-full text-xs uppercase transition-all duration-300"
              style={{
                fontFamily: F, fontWeight: 500, letterSpacing: '0.1em',
                background: !isAnnual ? 'rgba(137,137,137,0.12)' : 'transparent',
                color: !isAnnual ? '#e8e8e8' : '#616161',
              }}
            >Monthly</button>
            <button
              onClick={() => setIsAnnual(true)}
              className="px-5 py-2 rounded-full text-xs uppercase transition-all duration-300 flex items-center gap-2"
              style={{
                fontFamily: F, fontWeight: 500, letterSpacing: '0.1em',
                background: isAnnual ? 'rgba(137,137,137,0.12)' : 'transparent',
                color: isAnnual ? '#e8e8e8' : '#616161',
              }}
            >
              Annual
              <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', fontWeight: 600 }}>Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ═══ PLAN CARDS ═══ */}
      <section className="scroll-reveal relative py-16 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan) => {
              const price = isAnnual ? plan.price.annual : plan.price.monthly;
              return (
                <div
                  key={plan.name}
                  className="bento-card rounded-2xl flex flex-col"
                  onMouseMove={handleCardGlow}
                  style={{
                    background: plan.highlighted ? '#0c0c0c' : '#080808',
                    border: plan.highlighted ? '1px solid rgba(137,137,137,0.2)' : '1px solid rgba(46,46,46,0.4)',
                    padding: '28px 24px',
                    position: 'relative',
                    transform: plan.highlighted ? 'scale(1.03)' : 'scale(1)',
                    zIndex: plan.highlighted ? 2 : 1,
                  }}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[9px] uppercase"
                      style={{ background: 'linear-gradient(135deg, #434343, #2E2E2E)', border: '1px solid #616161', color: '#e8e8e8', fontFamily: F, fontWeight: 600, letterSpacing: '0.1em' }}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan name */}
                  <h3 className="text-sm mb-2" style={{ fontFamily: F, fontWeight: 500, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', position: 'relative', zIndex: 2 }}>
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-3" style={{ position: 'relative', zIndex: 2 }}>
                    <span className="text-4xl gradient-text-bright" style={{ fontFamily: F, fontWeight: 200 }}>
                      ₹{price}
                    </span>
                    {price > 0 && (
                      <span className="text-xs" style={{ color: '#494949', fontFamily: F, fontWeight: 300 }}>
                        / {plan.name === 'Team' ? 'seat / ' : ''}mo
                      </span>
                    )}
                  </div>

                  {/* Annual savings note */}
                  {isAnnual && plan.price.monthly > 0 && (
                    <p className="text-[10px] mb-4" style={{ color: '#4ade80', fontFamily: F, fontWeight: 400, position: 'relative', zIndex: 2 }}>
                      Save ₹{(plan.price.monthly - plan.price.annual) * 12}/year
                    </p>
                  )}
                  {(!isAnnual || plan.price.monthly === 0) && <div className="mb-4" />}

                  {/* Description */}
                  <p className="text-[11px] mb-6" style={{ color: '#616161', lineHeight: 1.7, fontFamily: F, fontWeight: 300, position: 'relative', zIndex: 2 }}>
                    {plan.desc}
                  </p>

                  {/* CTA */}
                  <button
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={loading === plan.name.toLowerCase()}
                    className={`btn-metal btn-magnetic w-full text-center py-3 rounded-xl text-xs uppercase mb-6 flex items-center justify-center gap-2 ${plan.highlighted ? 'glow-sm' : ''}`}
                    style={{ fontFamily: F, fontWeight: 500, letterSpacing: '0.08em', position: 'relative', zIndex: 2, cursor: loading ? 'wait' : 'pointer' }}
                  >
                    {loading === plan.name.toLowerCase() ? (
                      <><Loader2 size={12} className="animate-spin" /> Processing...</>
                    ) : (
                      plan.cta
                    )}
                  </button>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1" style={{ position: 'relative', zIndex: 2 }}>
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={11} className="mt-0.5 shrink-0" style={{ color: plan.highlighted ? '#898989' : '#494949' }} />
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: F, fontWeight: 300, lineHeight: 1.5 }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ ENTERPRISE CTA ═══ */}
      <section className="scroll-reveal relative py-12 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto">
          <div className="metal-card noise rounded-2xl px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6" style={{ position: 'relative' }}>
            <div>
              <h3 className="text-lg mb-2" style={{ fontFamily: FD, fontWeight: 500, color: '#e8e8e8', letterSpacing: '-0.01em' }}>
                Need unlimited reviews?
              </h3>
              <p className="text-xs" style={{ color: '#616161', fontFamily: F, fontWeight: 300, lineHeight: 1.7 }}>
                Enterprise plans include unlimited reviews, self-hosted options, custom AI fine-tuning, SLA guarantees, and a dedicated account manager.
              </p>
            </div>
            <Link href="mailto:hello@vanta.dev"
              className="btn-metal btn-magnetic px-6 py-3 rounded-xl text-xs uppercase shrink-0 flex items-center gap-2"
              style={{ fontFamily: F, fontWeight: 500, letterSpacing: '0.08em' }}
              onMouseMove={handleMagnetic} onMouseLeave={handleMagLeave}
            >
              Contact Sales <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(137,137,137,0.15), transparent)' }} />
      </div>

      {/* ═══ COMPARE TABLE ═══ */}
      <section className="scroll-reveal relative py-24 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl mb-3" style={{ fontFamily: FD, fontWeight: 500, color: '#e8e8e8', letterSpacing: '-0.02em' }}>
              Compare plans
            </h2>
            <p className="text-xs" style={{ color: '#616161', fontFamily: F, fontWeight: 300 }}>Every feature, side by side.</p>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(46,46,46,0.4)' }}>
            {/* Header */}
            <div className="grid grid-cols-4 gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="py-3 px-4" style={{ background: '#080808' }}>
                <span className="text-[10px] uppercase" style={{ color: '#494949', fontFamily: F, fontWeight: 500, letterSpacing: '0.12em' }}>Feature</span>
              </div>
              {['Starter', 'Pro', 'Team'].map(p => (
                <div key={p} className="py-3 px-4 text-center" style={{ background: '#080808' }}>
                  <span className="text-[10px] uppercase" style={{ color: p === 'Pro' ? '#e8e8e8' : '#494949', fontFamily: F, fontWeight: 500, letterSpacing: '0.12em' }}>{p}</span>
                </div>
              ))}
            </div>

            {/* Rows */}
            {COMPARE_FEATURES.map((row, i) => (
              <div key={row.name} className="grid grid-cols-4 gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="py-2.5 px-4" style={{ background: i % 2 === 0 ? '#060606' : '#080808' }}>
                  <span className="text-[11px]" style={{ color: '#616161', fontFamily: F, fontWeight: 300 }}>{row.name}</span>
                </div>
                {[row.free, row.pro, row.team].map((val, j) => (
                  <div key={j} className="py-2.5 px-4 text-center" style={{ background: i % 2 === 0 ? '#060606' : '#080808' }}>
                    <span className="text-[11px]" style={{
                      color: val === '\u2713' ? '#4ade80' : val === '\u2014' ? '#2E2E2E' : 'rgba(255,255,255,0.4)',
                      fontFamily: F, fontWeight: val === '\u2713' ? 500 : 300,
                    }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(137,137,137,0.15), transparent)' }} />
      </div>

      {/* ═══ FAQ ═══ */}
      <section className="scroll-reveal relative py-24 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl mb-10 text-center" style={{ fontFamily: FD, fontWeight: 500, color: '#e8e8e8', letterSpacing: '-0.02em' }}>
            Frequently asked questions
          </h2>
          <div className="space-y-1">
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(137,137,137,0.15), transparent)' }} />
      </div>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="scroll-reveal relative py-28 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl mb-5" style={{ fontFamily: FD, fontWeight: 400, color: '#e8e8e8', letterSpacing: '-0.01em' }}>
            Ready to ship <span className="gradient-text-bright">cleaner code</span>?
          </h2>
          <p className="text-sm mb-8" style={{ color: '#616161', fontFamily: F, fontWeight: 300, lineHeight: 1.8 }}>
            Start with 5 free reviews. No credit card required.
          </p>
          <Link href="/login"
            className="btn-metal btn-magnetic inline-flex items-center gap-3 px-8 py-3.5 rounded-xl text-sm uppercase"
            style={{ fontFamily: F, fontWeight: 500, letterSpacing: '0.08em' }}
            onMouseMove={handleMagnetic} onMouseLeave={handleMagLeave}
          >
            Get Started Free <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative py-12 px-6" style={{ zIndex: 1, borderTop: '1px solid rgba(46,46,46,0.3)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xs font-extralight" style={{ color: '#414141', fontFamily: F, letterSpacing: '0.3em' }}>VANTA</span>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[10px] transition-colors duration-300" style={{ color: '#333', fontFamily: F, fontWeight: 300 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#898989'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#333'}
            >Home</Link>
            <Link href="/pricing" className="text-[10px]" style={{ color: '#616161', fontFamily: F, fontWeight: 300 }}>Pricing</Link>
          </div>
          <span className="text-[10px]" style={{ color: '#2E2E2E', fontFamily: F, fontWeight: 300 }}>&copy; {new Date().getFullYear()} VANTA</span>
        </div>
      </footer>
    </div>
  );
}

/* ── FAQ Accordion Item ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const F = 'var(--font-sans)';
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{ background: open ? 'rgba(137,137,137,0.04)' : 'transparent', border: '1px solid', borderColor: open ? 'rgba(46,46,46,0.5)' : 'transparent' }}
    >
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-[12px]" style={{ color: open ? '#e8e8e8' : '#8B8B8B', fontFamily: F, fontWeight: 400 }}>{q}</span>
        <ChevronRight size={12} className="transition-transform duration-300 shrink-0 ml-4" style={{ color: '#494949', transform: open ? 'rotate(90deg)' : 'rotate(0)' }} />
      </button>
      <div className="overflow-hidden transition-all duration-400" style={{ maxHeight: open ? '200px' : '0', opacity: open ? 1 : 0 }}>
        <p className="px-5 pb-4 text-[11px]" style={{ color: '#616161', fontFamily: F, fontWeight: 300, lineHeight: 1.7 }}>{a}</p>
      </div>
    </div>
  );
}
