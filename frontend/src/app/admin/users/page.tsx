'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import type { User, PaginatedResponse } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { toast } from '@/store/toast.store';

const roleBadgeVariant = (role: string) => {
  if (role === 'ADMIN') return 'purple' as const;
  if (role === 'WORKER') return 'info' as const;
  return 'default' as const;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) router.push('/dashboard');
  }, [isLoading, isAuthenticated, user, router]);

  const fetchUsers = (p = 1) => {
    setLoading(true);
    api.get<{ data: PaginatedResponse<User> }>('/users', { params: { page: p, limit: 20 } })
      .then((res) => {
        setUsers(res.data.data.items);
        setTotalPages(res.data.data.meta.totalPages);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') fetchUsers();
  }, [isAuthenticated, user?.role]);

  const toggleActive = async (userId: string, isActive: boolean) => {
    try {
      await api.patch(`/users/${userId}/${isActive ? 'deactivate' : 'activate'}`);
      toast('success', 'Updated', `User ${isActive ? 'deactivated' : 'activated'} successfully`);
      fetchUsers(page);
    } catch {
      toast('error', 'Error', 'Failed to update user status');
    }
  };

  if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return <div className="p-6"><SkeletonTable rows={5} /></div>;
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Manage Users</h1>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-5 py-3 font-medium text-text-secondary">User</th>
                <th className="text-left px-5 py-3 font-medium text-text-secondary hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-medium text-text-secondary">Role</th>
                <th className="text-left px-5 py-3 font-medium text-text-secondary">Status</th>
                <th className="text-right px-5 py-3 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-text-muted">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-text-muted">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-tertiary/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar alt={`${u.firstName} ${u.lastName}`} size="sm" />
                        <span className="font-medium text-text-primary">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-text-secondary hidden sm:table-cell">{u.email}</td>
                    <td className="px-5 py-3">
                      <Badge variant={roleBadgeVariant(u.role)} size="sm">{u.role}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={u.isActive ? 'success' : 'danger'} size="sm" dot>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {u.role !== 'ADMIN' && (
                        <Button
                          variant={u.isActive ? 'ghost' : 'ghost'}
                          size="sm"
                          onClick={() => toggleActive(u.id, u.isActive)}
                          className={u.isActive ? 'text-danger hover:bg-danger-light' : 'text-success hover:bg-success-light'}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={fetchUsers} />
      </Card>
    </div>
  );
}
