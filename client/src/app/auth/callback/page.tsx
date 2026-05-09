'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { Suspense } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken, loadUser } = useAuthStore();
  // Prevent the effect from running twice in React StrictMode
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;

    const code = searchParams.get('code');

    if (!code) {
      // No code means auth failed or URL was tampered — send to login
      router.replace('/login');
      return;
    }

    // Validate basic code format before sending to server (64 hex chars)
    if (!/^[0-9a-f]{64}$/.test(code)) {
      console.error('Invalid auth code format');
      router.replace('/login');
      return;
    }

    exchanged.current = true;

    // Exchange the one-time code for the actual JWT.
    // The code is only valid for 60 seconds and is consumed on first use.
    // The JWT itself was never in the URL — only this opaque code was.
    axios
      .post(`${API_URL}/auth/exchange`, { code })
      .then((res) => {
        const { accessToken } = res.data.data;
        setToken(accessToken);
        return loadUser();
      })
      .then(() => {
        const returnTo = localStorage.getItem('aicr_return_to');
        if (returnTo) {
          localStorage.removeItem('aicr_return_to');
          router.replace(returnTo);
        } else {
          router.replace('/dashboard');
        }
      })
      .catch((err) => {
        console.error('Auth code exchange failed:', err?.response?.data?.error?.message || err.message);
        // Code expired or was already used — force a fresh login
        router.replace('/login');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
