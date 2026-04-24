'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { Suspense } from 'react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken, loadUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setToken(token);
      loadUser().then(() => {
        const returnTo = localStorage.getItem('aicr_return_to');
        if (returnTo) {
          localStorage.removeItem('aicr_return_to');
          router.push(returnTo);
        } else {
          router.push('/dashboard');
        }
      });
    } else {
      router.push('/login');
    }
  }, [searchParams, setToken, loadUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 pulse-glow"
          style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))' }}>
          <Sparkles size={28} color="white" />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Authenticating...
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Setting up your workspace
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }} />}>
      <CallbackContent />
    </Suspense>
  );
}
