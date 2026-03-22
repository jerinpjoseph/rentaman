'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import type { Booking, PaginatedResponse } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge, getBookingStatusVariant } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonTable } from '@/components/ui/Skeleton';

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) router.push('/dashboard');
  }, [isLoading, isAuthenticated, user, router]);

  const fetchBookings = (p = 1) => {
    setLoading(true);
    const params: Record<string, string | number> = { page: p, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    api.get<{ data: PaginatedResponse<Booking> }>('/admin/bookings', { params })
      .then((res) => {
        setBookings(res.data.data.items);
        setTotalPages(res.data.data.meta.totalPages);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') fetchBookings();
  }, [isAuthenticated, user?.role, statusFilter]);

  if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return <div className="p-6"><SkeletonTable rows={5} /></div>;
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-text-primary">All Bookings</h1>
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-5 py-3 font-medium text-text-secondary">Title</th>
                <th className="text-left px-5 py-3 font-medium text-text-secondary hidden md:table-cell">Customer</th>
                <th className="text-left px-5 py-3 font-medium text-text-secondary hidden md:table-cell">Worker</th>
                <th className="text-left px-5 py-3 font-medium text-text-secondary hidden sm:table-cell">Date</th>
                <th className="text-left px-5 py-3 font-medium text-text-secondary">Status</th>
                <th className="text-right px-5 py-3 font-medium text-text-secondary">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-text-muted">Loading...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-text-muted">No bookings found</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-tertiary/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/bookings/${b.id}`}
                        className="font-medium text-primary hover:text-primary-dark transition-colors"
                      >
                        {b.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-text-secondary hidden md:table-cell">
                      {b.customer.firstName} {b.customer.lastName}
                    </td>
                    <td className="px-5 py-3 text-text-secondary hidden md:table-cell">
                      {b.worker ? `${b.worker.firstName} ${b.worker.lastName}` : '-'}
                    </td>
                    <td className="px-5 py-3 text-text-secondary hidden sm:table-cell">
                      {new Date(b.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={getBookingStatusVariant(b.status)} size="sm" dot>
                        {statusLabels[b.status] || b.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-text-primary">
                      {b.totalAmount ? `$${b.totalAmount}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={fetchBookings} />
      </Card>
    </div>
  );
}
