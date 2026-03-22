'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  Home,
  CalendarDays,
  PlusCircle,
  Search,
  UserCircle,
  Shield,
  LogIn,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useChatStore } from '@/store/chat.store';

interface BottomNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  prominent?: boolean;
  badge?: number;
}

export function BottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { totalUnreadCount } = useChatStore();
  const role = user?.role;

  // Hide on landing page when not authenticated
  if (!isAuthenticated && pathname === '/') return null;

  let items: BottomNavItem[] = [];

  if (!isAuthenticated) {
    items = [
      { label: 'Home', href: '/', icon: Home },
      { label: 'Workers', href: '/workers', icon: Search },
      { label: 'Sign In', href: '/login', icon: LogIn },
      { label: 'Register', href: '/register', icon: UserCircle },
    ];
  } else if (role === 'CUSTOMER') {
    items = [
      { label: 'Home', href: '/dashboard', icon: Home },
      { label: 'Workers', href: '/workers', icon: Search },
      { label: 'Book', href: '/dashboard/bookings/new', icon: PlusCircle, prominent: true },
      { label: 'Chat', href: '/dashboard/chat', icon: MessageSquare, badge: totalUnreadCount },
      { label: 'Profile', href: '/dashboard/profile', icon: UserCircle },
    ];
  } else if (role === 'WORKER') {
    items = [
      { label: 'Home', href: '/dashboard', icon: Home },
      { label: 'Jobs', href: '/dashboard', icon: Briefcase },
      { label: 'Chat', href: '/dashboard/chat', icon: MessageSquare, badge: totalUnreadCount },
      { label: 'Profile', href: '/dashboard/profile', icon: UserCircle },
    ];
  } else if (role === 'ADMIN') {
    items = [
      { label: 'Dashboard', href: '/admin', icon: Shield },
      { label: 'Users', href: '/admin/users', icon: UserCircle },
      { label: 'Workers', href: '/admin/workers', icon: Search },
      { label: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
      { label: 'Profile', href: '/dashboard/profile', icon: UserCircle },
    ];
  }

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href === '/' && pathname === '/') return true;
    if (href !== '/dashboard' && href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl
        border-t border-border safe-area-bottom"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          if (item.prominent) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center -mt-5 focus-ring rounded-full"
                aria-label={item.label}
              >
                <div className="w-12 h-12 rounded-full bg-primary shadow-card-hover
                  flex items-center justify-center text-white">
                  <Icon size={22} />
                </div>
                <span className="text-[10px] mt-1 font-medium text-primary">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl
                transition-colors focus-ring relative
                ${active ? 'text-primary' : 'text-text-muted'}`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -top-0.5 w-6 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <div className="relative">
                <Icon size={20} />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] rounded-full bg-primary
                    text-white text-[8px] font-bold flex items-center justify-center px-0.5">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
