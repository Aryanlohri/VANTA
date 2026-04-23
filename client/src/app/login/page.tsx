'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, Shield, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleGitHubLogin = async () => {
    setLoginLoading(true);
    try {
      const response = await authApi.getLoginUrl();
      window.location.href = response.data.data.url;
    } catch (error) {
      console.error('Login failed:', error);
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: '#030303' }}>
      
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(137,137,137,0.06), transparent)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-xs tracking-wider uppercase mb-8 transition-colors duration-300"
          style={{ color: '#616161' }}
          onMouseEnter={e => e.currentTarget.style.color = '#898989'}
          onMouseLeave={e => e.currentTarget.style.color = '#616161'}>
          <ArrowLeft size={12} /> Back
        </Link>

        <div className="metal-card p-8 noise relative animate-fade-in-up">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <span className="text-lg tracking-[0.3em] font-light" style={{ color: '#898989' }}>VANTA</span>
          </div>

          <h2 className="text-xl font-light tracking-wider mb-2" style={{ color: '#e8e8e8' }}>
            Welcome back
          </h2>
          <p className="text-sm font-light mb-8" style={{ color: '#616161' }}>
            Sign in with GitHub to start reviewing code.
          </p>

          {/* GitHub Login Button */}
          <button
            onClick={handleGitHubLogin}
            disabled={loginLoading}
            className="w-full btn-metal flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-sm font-medium tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <GitBranch size={18} strokeWidth={1.5} />
            {loginLoading ? 'Redirecting...' : 'Continue with GitHub'}
          </button>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            <span className="px-3 text-[10px] tracking-widest uppercase" style={{ color: '#494949' }}>What you get</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {[
              { icon: Zap, text: 'Instant AI-powered code reviews' },
              { icon: Shield, text: 'Security vulnerability detection' },
              { icon: GitBranch, text: 'Seamless GitHub integration' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(137,137,137,0.06)', border: '1px solid rgba(137,137,137,0.08)', color: '#898989' }}>
                  <item.icon size={14} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-light" style={{ color: '#8B8B8B' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] tracking-wider mt-6" style={{ color: '#414141' }}>
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
