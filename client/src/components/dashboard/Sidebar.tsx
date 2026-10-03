'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, GitBranch, FileCode, Plus, LogOut,
  Shield, Activity, Menu, Settings, User
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';
import Cookies from 'js-cookie';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/repositories', icon: GitBranch, label: 'Repositories' },
  { href: '/dashboard/reviews', icon: FileCode, label: 'Reviews' },
  { href: '/dashboard/analytics', icon: Activity, label: 'Analytics' },
];

const ADMIN_NAV_ITEM = { href: '/dashboard/admin', icon: Shield, label: 'Admin Panel' };

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  isMobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed, isMobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const isExpanded = !collapsed || isHovered;

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for Cmd+B
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collapsed, setCollapsed]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const allNavItems = user?.role === 'admin' ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  const sidebarContent = (
    <motion.aside
      initial={false}
      animate={{ 
        width: isExpanded ? 240 : 64,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setPopoverOpen(false); // Close popover when mouse leaves sidebar
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "shrink-0 flex flex-col h-screen sticky top-0 z-40 overflow-hidden",
        "border-r border-[var(--color-border)]",
        "bg-[#0a0a0a]"
      )}
    >
      <style>{`
        @keyframes powerup {
          0% { background-position: 50% 200%; }
          100% { background-position: 50% -100%; }
        }
        .animate-powerup {
          background: linear-gradient(to top, #494949 0%, #ffffff 30%, #494949 60%);
          background-size: 100% 300%;
          -webkit-background-clip: text;
          color: transparent;
          animation: powerup 3s ease-in-out infinite;
        }
      `}</style>

      {/* Header Container (Fixed width to prevent squishing during animation) */}
      <div className="w-[240px] flex flex-col flex-1">
        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-[var(--color-border)] justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className={cn("flex items-center shrink-0 h-8", !isExpanded ? "w-8 justify-center" : "justify-start")}>
              {!isExpanded ? (
                <span className="text-[16px] font-bold animate-powerup">V</span>
              ) : (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm tracking-[0.3em] font-light text-[#898989]"
                >
                  VANTA
                </motion.span>
              )}
            </Link>
          </div>
          
          <button
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
            aria-expanded={isExpanded}
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors hidden md:block text-[#616161] hover:text-[#898989] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-start)]"
          >
            <Menu size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* New Review Button */}
        <div className="p-3 shrink-0">
          <Link href="/dashboard/reviews/new"
            className={cn(
              "btn-metal flex items-center justify-center rounded-lg text-xs font-medium tracking-wider uppercase transition-all overflow-hidden",
              !isExpanded ? "w-10 h-10 p-0" : "w-full h-10 gap-2 px-4"
            )}>
            <Plus size={16} strokeWidth={1.5} className="shrink-0" />
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap"
              >
                New Review
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-x-hidden flex flex-col">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const isAdminItem = item.href === '/dashboard/admin';
            
            return (
              <div key={item.href} className={cn("relative group", isAdminItem && "mt-auto pt-2 border-t border-[var(--color-border)]")}>
                <Link href={item.href}
                  className={cn(
                    "flex items-center rounded-lg text-[13px] tracking-wide transition-all duration-300 relative z-10",
                    !isExpanded ? "justify-center h-10 w-10" : "px-4 h-10 gap-3 w-full",
                    isActive ? (isAdminItem ? "text-[#4ade80]" : "text-[#e8e8e8]") : "text-[#616161] hover:text-[#898989]",
                  )}>
                  <item.icon size={16} strokeWidth={isActive ? 2 : 1.5} className="shrink-0 relative z-10" />
                  
                  {isExpanded && (
                    <motion.span 
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 }}
                      className="whitespace-nowrap relative z-10 font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  
                  {/* Active Layout ID Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className={cn(
                        "absolute inset-0 rounded-lg",
                        !isExpanded && "w-10",
                        isAdminItem ? "bg-[#4ade80]/10" : "bg-white/5"
                      )}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  
                  {/* Active left border indicator */}
                  {isActive && isExpanded && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className={cn(
                        "absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full",
                        isAdminItem ? "bg-[#4ade80]" : "bg-[#898989]"
                      )}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-black border border-[var(--color-border)] rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex items-center gap-2 whitespace-nowrap shadow-xl">
                    <span className="text-[10px] tracking-widest uppercase text-[#e8e8e8] font-medium">{item.label}</span>
                    {item.label === 'Overview' && (
                      <span className="text-[9px] text-[#616161] bg-white/5 px-1 py-0.5 rounded leading-none border border-white/5">⌘B</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="relative border-t border-[var(--color-border)] p-3 shrink-0" ref={popoverRef}>
          <button 
            onClick={() => setPopoverOpen(!popoverOpen)}
            className={cn(
              "flex items-center gap-3 rounded-lg transition-colors hover:bg-white/5",
              !isExpanded ? "justify-center p-1 w-10" : "p-2 text-left w-full"
            )}
            aria-expanded={popoverOpen}
            aria-label="User menu"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full opacity-90 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full shrink-0 bg-[#1a1a1a] flex items-center justify-center text-xs text-[#898989]">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0 flex flex-col"
              >
                <p className="text-[13px] font-medium truncate text-[#e8e8e8]">{(user as any)?.display_name || user?.username}</p>
                <p className="text-[11px] truncate text-[#616161]">{user?.email || 'No email'}</p>
              </motion.div>
            )}
          </button>

          {/* Popover */}
          <AnimatePresence>
            {popoverOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "absolute bottom-full mb-2 bg-[#0a0a0a] border border-[var(--color-border)] rounded-xl shadow-2xl py-1 z-50",
                  !isExpanded ? "left-3 w-48" : "left-3 right-3"
                )}
              >
                <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
                  <p className="text-xs font-medium text-[#e8e8e8] truncate">{(user as any)?.display_name || user?.username}</p>
                  <p className="text-[10px] text-[#616161] truncate">{user?.email}</p>
                </div>
                <button className="w-full text-left px-3 py-1.5 text-xs text-[#898989] hover:text-[#e8e8e8] hover:bg-white/5 transition-colors flex items-center gap-2">
                  <Settings size={14} /> Settings
                </button>
                <button className="w-full text-left px-3 py-1.5 text-xs text-[#898989] hover:text-[#e8e8e8] hover:bg-white/5 transition-colors flex items-center gap-2">
                  <User size={14} /> Profile
                </button>
                <button 
                  onClick={logout}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors flex items-center gap-2 mt-1 border-t border-[var(--color-border)] pt-2"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar & Drawer overlay */}
      <div className="md:hidden">
        {/* Mobile Header Toggle */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-[#0a0a0a] border-b border-[var(--color-border)] z-30 flex items-center px-4 justify-between">
          <Link href="/dashboard" className="text-sm tracking-[0.3em] font-light text-[#898989]">
            VANTA
          </Link>
          <button onClick={() => setMobileOpen(true)} className="p-2 text-[#e8e8e8]">
            <Menu size={20} />
          </button>
        </div>

        {/* Backdrop */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
          )}
        </AnimatePresence>

        {/* Drawer */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex"
            >
              <div className="w-[240px] h-full shadow-2xl" onClick={e => e.stopPropagation()}>
                {sidebarContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
