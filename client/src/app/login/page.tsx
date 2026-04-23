'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, Sparkles, Shield, Zap, ArrowLeft } from 'lucide-react';
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
      style={{ background: 'var(--color-bg-primary)' }}>
      
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'var(--color-accent-start)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'var(--color-accent-end)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8 transition-colors hover:opacity-80"
          style={{ color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div className="glass-card p-8 animate-fade-in-up">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))' }}>
              <Sparkles size={20} color="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>CodeLens AI</h1>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>AI-Powered Code Review</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Welcome back
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            Sign in with GitHub to access your dashboard and start reviewing code.
          </p>

          {/* GitHub Login Button */}
          <button
            onClick={handleGitHubLogin}
            disabled={loginLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loginLoading ? 'var(--color-bg-hover)' : '#24292e',
              color: 'white',
              border: '1px solid #444',
            }}
          >
            <GitBranch size={20} />
            {loginLoading ? 'Redirecting...' : 'Continue with GitHub'}
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            <span className="px-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>What you get</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {[
              { icon: Zap, text: 'Instant AI-powered code reviews' },
              { icon: Shield, text: 'Security vulnerability detection' },
              { icon: GitBranch, text: 'Seamless GitHub integration' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent-start)' }}>
                  <item.icon size={14} />
                </div>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
