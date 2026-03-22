'use client';

import Navbar from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { NotificationToast } from './NotificationToast';
import { useAuthStore } from '@/store/auth.store';
import { useLayoutStore } from '@/store/layout.store';
import { usePathname } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { sidebarCollapsed } = useLayoutStore();
  const pathname = usePathname();

  // Landing page has no sidebar/bottom nav
  const isLandingPage = pathname === '/';
  const showSidebar = isAuthenticated && !isLandingPage;

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Navbar />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main
          className={`flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300
            ${showSidebar
              ? sidebarCollapsed
                ? 'lg:ml-[var(--width-sidebar-collapsed)]'
                : 'lg:ml-[var(--width-sidebar)]'
              : ''
            }
            ${isAuthenticated && !isLandingPage ? 'pb-20 lg:pb-0' : ''}`}
        >
          {children}
        </main>
      </div>
      <BottomNav />
      <NotificationToast />
    </div>
  );
}
