'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import type { Booking, PaginatedResponse } from '@/types';
import {
  Plus,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  Briefcase,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, getBookingStatusVariant } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonStatCard, SkeletonCard } from '@/components/ui/Skeleton';

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get<{ data: PaginatedResponse<Booking> }>('/bookings', { params: { limit: 50 } })
      .then((res) => setBookings(res.data.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const isWorker = user?.role === 'WORKER';
  const pending = bookings.filter((b) => b.status === 'PENDING');
  const active = bookings.filter((b) => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS');
  const completed = bookings.filter((b) => b.status === 'COMPLETED');

  const filteredBookings = activeTab === 'all'
    ? bookings
    : activeTab === 'active'
      ? active
      : activeTab === 'pending'
        ? pending
        : activeTab === 'completed'
          ? completed
          : bookings.filter((b) => b.status === 'CANCELLED');

  const stats = [
    { label: 'Total', value: bookings.length, icon: CalendarDays, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pending', value: pending.length, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Active', value: active.length, icon: TrendingUp, color: 'text-info', bg: 'bg-info/10' },
    { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  ];

  const tabs = [
    { label: 'All', value: 'all', count: bookings.length },
    { label: 'Pending', value: 'pending', count: pending.length },
    { label: 'Active', value: 'active', count: active.length },
    { label: 'Completed', value: 'completed', count: completed.length },
    { label: 'Cancelled', value: 'cancelled', count: bookings.filter((b) => b.status === 'CANCELLED').length },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome, {user?.firstName}!
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isWorker ? 'Manage your incoming jobs and bookings' : 'Manage your bookings and find helpers'}
          </p>
        </div>
        {!isWorker && (
          <Link href="/dashboard/bookings/new">
            <Button leftIcon={<Plus size={16} />}>
              New Booking
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card padding="md">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-text-secondary">{stat.label}</p>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon size={18} className={stat.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bookings */}
      <Card padding="none">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">
            {isWorker ? 'Your Jobs' : 'Your Bookings'}
          </h2>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={28} className="text-text-muted" />}
            title={activeTab === 'all' ? 'No bookings yet' : `No ${activeTab} bookings`}
            description={
              isWorker
                ? 'Make sure your profile is set up and you are available.'
                : 'Create your first booking to get started!'
            }
            actionLabel={!isWorker && activeTab === 'all' ? 'Create Booking' : undefined}
            actionHref={!isWorker && activeTab === 'all' ? '/dashboard/bookings/new' : undefined}
          />
        ) : (
          <div className="divide-y divide-border">
            {filteredBookings.map((booking, i) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={`/dashboard/bookings/${booking.id}`}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-surface-tertiary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-medium text-text-primary truncate">{booking.title}</h3>
                      <Badge variant={getBookingStatusVariant(booking.status)} size="sm" dot>
                        {statusLabels[booking.status] || booking.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-text-secondary">
                      {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}
                      <span className="mx-1.5 text-border">|</span>
                      {booking.city}
                      {booking.totalAmount && (
                        <>
                          <span className="mx-1.5 text-border">|</span>
                          <span className="font-medium text-text-primary">${booking.totalAmount}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-text-muted ml-4 shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
