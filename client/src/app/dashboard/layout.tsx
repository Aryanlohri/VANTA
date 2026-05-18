'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, GitBranch, FileCode, Plus, LogOut,
  ChevronRight, Shield
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/repositories', icon: GitBranch, label: 'Repositories' },
  { href: '/dashboard/reviews', icon: FileCode, label: 'Reviews' },
];

const ADMIN_NAV_ITEM = { href: '/dashboard/admin', icon: Shield, label: 'Admin Panel' };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#030303' }}>
        <div className="text-sm tracking-[0.3em] font-light pulse-glow px-4 py-2 rounded-lg"
          style={{ color: '#616161' }}>
          VANTA
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex font-sans" style={{ background: '#030303' }}>
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col h-screen sticky top-0"
        style={{ background: '#0a0a0a', borderRight: '1px solid var(--color-border)' }}>
        
        {/* Logo */}
        <div className="px-5 h-14 flex items-center" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <span className="text-sm tracking-[0.3em] font-light" style={{ color: '#898989' }}>VANTA</span>
        </div>

        {/* New Review Button */}
        <div className="px-4 pt-4">
          <Link href="/dashboard/reviews/new"
            className="btn-metal w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wider uppercase">
            <Plus size={14} strokeWidth={1.5} /> New Review
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 rounded-lg text-[13px] tracking-wide transition-all duration-300"
                style={{
                  padding: '9px 20px',
                  background: isActive ? 'rgba(137,137,137,0.06)' : 'transparent',
                  color: isActive ? '#e8e8e8' : '#616161',
                  borderLeft: isActive ? '2px solid #898989' : '2px solid transparent',
                  fontWeight: isActive ? 500 : 400,
                }}>
                <item.icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto" style={{ color: '#616161' }} />}
              </Link>
            );
          })}
          
          {/* Admin Panel Link */}
          {user?.role === 'admin' && (() => {
            const isActive = pathname === ADMIN_NAV_ITEM.href;
            return (
              <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                <Link href={ADMIN_NAV_ITEM.href}
                  className="flex items-center gap-3 rounded-lg text-[13px] tracking-wide transition-all duration-300"
                  style={{
                    padding: '9px 20px',
                    background: isActive ? 'rgba(34,197,94,0.1)' : 'transparent',
                    color: isActive ? '#4ade80' : '#898989',
                    borderLeft: isActive ? '2px solid #22c55e' : '2px solid transparent',
                    fontWeight: isActive ? 500 : 400,
                  }}>
                  <ADMIN_NAV_ITEM.icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                  {ADMIN_NAV_ITEM.label}
                  {isActive && <ChevronRight size={14} className="ml-auto" style={{ color: '#4ade80' }} />}
                </Link>
              </div>
            );
          })()}
        </nav>

        {/* User Footer */}
        <div className="p-5 flex gap-3 items-start" style={{ borderTop: '1px solid var(--color-border)' }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full opacity-80 shrink-0 mt-0.5" />
          ) : (
            <div className="w-8 h-8 rounded-full shrink-0 mt-0.5" style={{ background: '#1a1a1a' }} />
          )}
          <div className="flex-1 min-w-0 flex flex-col items-start">
            <p className="text-[13px] font-medium truncate w-full" style={{ color: '#e8e8e8' }}>{user?.username}</p>
            <p className="text-[11px] truncate w-full mb-3" style={{ color: '#616161' }}>{user?.email || 'No email'}</p>
            <button onClick={logout}
              className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors duration-200"
              style={{ color: '#898989' }}
              onMouseEnter={e => e.currentTarget.style.color = '#e8e8e8'}
              onMouseLeave={e => e.currentTarget.style.color = '#898989'}>
              <LogOut size={12} strokeWidth={2} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
