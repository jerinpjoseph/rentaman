'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useLayoutStore } from '@/store/layout.store';
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Users,
  UserCircle,
  Shield,
  CheckSquare,
  Briefcase,
  Clock,
  Search,
  ChevronLeft,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/chat.store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
  const { totalUnreadCount } = useChatStore();

  if (!isAuthenticated) return null;

  const role = user?.role;

  const mainNav: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  if (role === 'CUSTOMER') {
    mainNav.push(
      { label: 'My Bookings', href: '/dashboard', icon: CalendarDays },
      { label: 'New Booking', href: '/dashboard/bookings/new', icon: PlusCircle },
      { label: 'Find Workers', href: '/workers', icon: Search },
      { label: 'Messages', href: '/dashboard/chat', icon: MessageSquare, badge: totalUnreadCount },
    );
  }

  if (role === 'WORKER') {
    mainNav.push(
      { label: 'My Jobs', href: '/dashboard', icon: Briefcase },
      { label: 'Availability', href: '/dashboard/profile', icon: Clock },
      { label: 'Browse Workers', href: '/workers', icon: Search },
      { label: 'Messages', href: '/dashboard/chat', icon: MessageSquare, badge: totalUnreadCount },
    );
  }

  const adminNav: NavItem[] = role === 'ADMIN' ? [
    { label: 'Admin Panel', href: '/admin', icon: Shield },
    { label: 'Manage Users', href: '/admin/users', icon: Users },
    { label: 'Verifications', href: '/admin/workers', icon: CheckSquare },
    { label: 'All Bookings', href: '/admin/bookings', icon: CalendarDays },
  ] : [];

  const bottomNav: NavItem[] = [
    { label: 'Profile', href: '/dashboard/profile', icon: UserCircle },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-30
        bg-surface border-r border-border transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-[var(--width-sidebar-collapsed)]' : 'w-[var(--width-sidebar)]'}`}
    >
      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
        <NavSection items={mainNav} collapsed={sidebarCollapsed} isActive={isActive} pathname={pathname} />

        {adminNav.length > 0 && (
          <>
            <div className="my-3 mx-2 border-t border-border" />
            {!sidebarCollapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Admin
              </p>
            )}
            <NavSection items={adminNav} collapsed={sidebarCollapsed} isActive={isActive} pathname={pathname} />
          </>
        )}
      </div>

      {/* Bottom section */}
      <div className="border-t border-border p-3">
        <NavSection items={bottomNav} collapsed={sidebarCollapsed} isActive={isActive} pathname={pathname} />

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="mt-2 w-full flex items-center justify-center gap-2 h-9 rounded-xl
            text-text-muted hover:text-text-secondary hover:bg-surface-tertiary transition-colors focus-ring"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.div
            animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeft size={16} />
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-xs overflow-hidden whitespace-nowrap"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </aside>
  );
}

function NavSection({
  items,
  collapsed,
  isActive,
  pathname,
}: {
  items: NavItem[];
  collapsed: boolean;
  isActive: (href: string) => boolean;
  pathname: string;
}) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={`relative flex items-center gap-3 h-10 rounded-xl px-3 text-sm font-medium
              transition-colors focus-ring group
              ${active
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
              }
              ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? item.label : undefined}
            aria-current={active ? 'page' : undefined}
          >
            {active && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-primary/10 rounded-xl"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <Icon size={18} className="relative z-10 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="relative z-10 overflow-hidden whitespace-nowrap flex-1"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {item.badge != null && item.badge > 0 && (
              <span className="relative z-10 min-w-[18px] h-[18px] rounded-full bg-primary
                text-white text-[10px] font-bold flex items-center justify-center px-1">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
