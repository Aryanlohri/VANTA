'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, GitBranch, FileCode, Plus, LogOut,
  Sparkles, ChevronRight
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="w-8 h-8 rounded-lg pulse-glow" style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))' }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col h-screen sticky top-0"
        style={{ background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)' }}>
        
        {/* Logo */}
        <div className="px-5 h-16 flex items-center gap-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))' }}>
            <Sparkles size={16} color="white" />
          </div>
          <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>CodeLens AI</span>
        </div>

        {/* New Review Button */}
        <div className="px-4 pt-4">
          <Link href="/dashboard/reviews/new"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))',
              color: 'white',
            }}>
            <Plus size={16} /> New Review
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: isActive ? 'var(--color-accent-glow)' : 'transparent',
                  color: isActive ? 'var(--color-accent-start)' : 'var(--color-text-secondary)',
                  borderLeft: isActive ? '2px solid var(--color-accent-start)' : '2px solid transparent',
                }}>
                <item.icon size={18} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3 mb-3">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-bg-hover)' }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{user?.username}</p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{user?.email || 'No email'}</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-80"
            style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}>
            <LogOut size={14} /> Sign Out
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
