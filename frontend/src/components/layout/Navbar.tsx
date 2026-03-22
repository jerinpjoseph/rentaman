'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useLayoutStore } from '@/store/layout.store';
import { Bell, Menu, LogOut, User, ChevronDown, Search, MessageSquare } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useChatStore } from '@/store/chat.store';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { toggleSidebar } = useLayoutStore();
  const { totalUnreadCount } = useChatStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-40 h-16 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Menu toggle + Logo */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl
                bg-surface-tertiary hover:bg-border text-text-secondary hover:text-text-primary
                transition-colors focus-ring"
              aria-label="Toggle sidebar"
            >
              <Menu size={18} />
            </button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-lg font-bold text-text-primary hidden sm:inline">
              RentA<span className="text-primary">Man</span>
            </span>
          </Link>
        </div>

        {/* Center: Search (desktop, authenticated) */}
        {isAuthenticated && (
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search workers, bookings..."
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-surface-tertiary border border-transparent
                  text-sm text-text-primary placeholder:text-text-muted
                  focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
                  transition-all"
              />
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {/* Chat */}
              <Link
                href="/dashboard/chat"
                className="relative w-9 h-9 flex items-center justify-center rounded-xl
                  bg-surface-tertiary hover:bg-border text-text-secondary hover:text-text-primary
                  transition-colors focus-ring"
                aria-label="Messages"
              >
                <MessageSquare size={18} />
                {totalUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] rounded-full bg-primary
                    text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <button
                className="relative w-9 h-9 flex items-center justify-center rounded-xl
                  bg-surface-tertiary hover:bg-border text-text-secondary hover:text-text-primary
                  transition-colors focus-ring"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
              </button>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-xl
                    hover:bg-surface-tertiary transition-colors focus-ring"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-text-primary">
                    {user?.firstName}
                  </span>
                  <ChevronDown size={14} className="text-text-muted" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface-elevated rounded-xl
                    border border-border shadow-elevated py-1 z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-text-primary">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-text-muted">{user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary
                        hover:bg-surface-tertiary hover:text-text-primary transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User size={16} />
                      Profile
                    </Link>
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-danger
                        hover:bg-danger-light transition-colors"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex h-9 px-4 items-center text-sm font-medium
                  text-text-secondary hover:text-text-primary transition-colors focus-ring"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="h-9 px-4 inline-flex items-center text-sm font-medium
                  bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors focus-ring"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
