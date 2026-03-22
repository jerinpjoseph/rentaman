'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { Users, Briefcase, CalendarDays, DollarSign, IndianRupee, TrendingUp, Wallet, ArrowRight, Settings, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SkeletonStatCard } from '@/components/ui/Skeleton';
import { toast } from '@/store/toast.store';
import type { DashboardStats } from '@/types';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [commissionPercent, setCommissionPercent] = useState<number>(15);
  const [savingCommission, setSavingCommission] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') return;
    Promise.all([
      api.get<{ data: DashboardStats }>('/admin/dashboard'),
      api.get<{ data: { commissionPercent: number } }>('/admin/config/commission'),
    ])
      .then(([dashRes, commRes]) => {
        setStats(dashRes.data.data);
        const comm = commRes.data.data?.commissionPercent ?? (commRes.data as any)?.commissionPercent;
        if (comm != null) setCommissionPercent(comm);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.role]);

  const saveCommission = async () => {
    setSavingCommission(true);
    try {
      await api.patch('/admin/config/commission', { commissionPercent });
      toast('success', 'Commission Updated', `Commission rate set to ${commissionPercent}%`);
    } catch (err: any) {
      toast('error', 'Error', err.response?.data?.message || 'Failed to update commission');
    } finally {
      setSavingCommission(false);
    }
  };

  if (isLoading || loading || !stats) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary', bg: 'bg-primary/10', href: '/admin/users' },
    { label: 'Total Workers', value: stats.totalWorkers, icon: Briefcase, color: 'text-accent', bg: 'bg-accent/10', href: '/admin/workers' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: CalendarDays, color: 'text-purple', bg: 'bg-purple/10', href: '/admin/bookings' },
    { label: 'Total GMV', value: `\u20B9${Number(stats.totalRevenue).toLocaleString()}`, icon: IndianRupee, color: 'text-warning', bg: 'bg-warning/10', href: '#' },
    { label: 'Platform Revenue', value: `\u20B9${Number(stats.platformRevenue).toLocaleString()}`, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', href: '#' },
    { label: 'Worker Payouts', value: `\u20B9${Number(stats.workerPayouts).toLocaleString()}`, icon: Wallet, color: 'text-info', bg: 'bg-info/10', href: '#' },
  ];

  const navCards = [
    { title: 'Manage Users', desc: 'View, activate, and deactivate user accounts', href: '/admin/users' },
    { title: 'Worker Verification', desc: 'Review and verify worker profiles', href: '/admin/workers' },
    { title: 'All Bookings', desc: 'View and manage all platform bookings', href: '/admin/bookings' },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={card.href}>
              <Card hoverable padding="md">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-text-secondary">{card.label}</p>
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon size={18} className={card.color} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-primary">{card.value}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Commission Config */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Commission Settings</h3>
              <p className="text-xs text-text-muted">Configure the platform commission rate applied to bookings</p>
            </div>
          </div>
          <div className="flex items-end gap-3 max-w-md">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-primary mb-1.5">Commission Rate (%)</label>
              <input
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <Button onClick={saveCommission} isLoading={savingCommission} leftIcon={<Save size={16} />}>
              Save
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {navCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
          >
            <Link href={card.href}>
              <Card hoverable padding="md" className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">{card.title}</h3>
                  <p className="text-sm text-text-secondary">{card.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-primary text-sm font-medium mt-4">
                  View <ArrowRight size={14} />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
