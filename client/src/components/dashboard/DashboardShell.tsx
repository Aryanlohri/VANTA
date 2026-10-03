'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import { Sidebar } from './Sidebar';
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: React.ReactNode;
  defaultCollapsed: boolean;
}

export function DashboardShell({ children, defaultCollapsed }: DashboardShellProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  
  const [collapsed, setCollapsedState] = useState(defaultCollapsed);
  const [isMobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const setCollapsed = (val: boolean) => {
    setCollapsedState(val);
    Cookies.set('sidebar:collapsed', val ? 'true' : 'false', { expires: 365, path: '/' });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [children]);

  // Handle ESC to close drawer
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-sm tracking-[0.3em] font-light pulse-glow px-4 py-2 rounded-lg text-[#616161]">
          VANTA
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex font-sans bg-[#050505] text-[#e8e8e8]">
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        isMobileOpen={isMobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      <main className={cn(
        "flex-1 overflow-y-auto relative transition-all duration-300",
        "pt-14 md:pt-0" // Add padding top for mobile header
      )}>
        <div className="max-w-6xl mx-auto px-6 py-8 md:px-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
