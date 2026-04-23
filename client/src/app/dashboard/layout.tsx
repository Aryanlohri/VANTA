'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, GitBranch, FileCode, Plus, LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/repositories', icon: GitBranch, label: 'Repositories' },
  { href: '/dashboard/reviews', icon: FileCode, label: 'Reviews' },
];

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
    <div className="min-h-screen flex" style={{ background: '#030303' }}>
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
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium tracking-wider transition-all duration-300"
                style={{
                  background: isActive ? 'rgba(137,137,137,0.06)' : 'transparent',
                  color: isActive ? '#e8e8e8' : '#616161',
                  borderLeft: isActive ? '2px solid #898989' : '2px solid transparent',
                }}>
                <item.icon size={16} strokeWidth={1.5} />
                {item.label}
                {isActive && <ChevronRight size={12} className="ml-auto" style={{ color: '#494949' }} />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-3">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-7 h-7 rounded-full opacity-80" />
            ) : (
              <div className="w-7 h-7 rounded-full" style={{ background: '#1a1a1a' }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: '#8B8B8B' }}>{user?.username}</p>
              <p className="text-[10px] truncate" style={{ color: '#494949' }}>{user?.email || ''}</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-medium tracking-wider uppercase transition-all duration-300"
            style={{ background: 'rgba(137,137,137,0.04)', color: '#616161', border: '1px solid rgba(46,46,46,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#898989'}
            onMouseLeave={e => e.currentTarget.style.color = '#616161'}>
            <LogOut size={12} strokeWidth={1.5} /> Sign Out
          </button>
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
