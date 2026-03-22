'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import type { WorkerProfile } from '@/types';
import { CheckCircle, XCircle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, getVerificationVariant } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { toast } from '@/store/toast.store';

export default function AdminWorkersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) router.push('/dashboard');
  }, [isLoading, isAuthenticated, user, router]);

  const fetchWorkers = () => {
    setLoading(true);
    api.get('/admin/verifications')
      .then((res) => {
        const data = res.data.data;
        // Handle both array and paginated response formats
        setWorkers(Array.isArray(data) ? data : data.items ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') fetchWorkers();
  }, [isAuthenticated, user?.role]);

  const verify = async (workerId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await api.patch(`/admin/verifications/${workerId}`, { status });
      toast('success', 'Updated', `Worker ${status.toLowerCase()} successfully`);
      fetchWorkers();
    } catch {
      toast('error', 'Error', 'Failed to update verification status');
    }
  };

  if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Worker Verification</h1>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : workers.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="No pending verifications"
            description="All worker profiles have been reviewed."
            icon={<CheckCircle size={28} className="text-success" />}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {workers.map((worker, i) => (
            <motion.div
              key={worker.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card padding="md">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar
                      alt={`${worker.user.firstName} ${worker.user.lastName}`}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        {worker.user.firstName} {worker.user.lastName}
                      </h3>
                      {worker.city && (
                        <p className="text-sm text-text-muted flex items-center gap-1 mt-0.5">
                          <MapPin size={12} />
                          {worker.city}{worker.state ? `, ${worker.state}` : ''}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {worker.skills.map((skill) => (
                          <Badge key={skill} variant="info" size="sm">{skill}</Badge>
                        ))}
                      </div>
                      <p className="text-sm text-text-secondary mt-2">
                        ${worker.hourlyRate}/hr &middot; {worker.experienceYears}yr experience
                      </p>
                      <Badge
                        variant={getVerificationVariant(worker.verificationStatus)}
                        size="sm"
                        dot
                        className="mt-2"
                      >
                        {worker.verificationStatus}
                      </Badge>
                    </div>
                  </div>

                  {worker.verificationStatus === 'PENDING' && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={() => verify(worker.id, 'VERIFIED')}
                        leftIcon={<CheckCircle size={16} />}
                        className="bg-success text-white hover:bg-green-600"
                        size="sm"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => verify(worker.id, 'REJECTED')}
                        leftIcon={<XCircle size={16} />}
                        className="text-danger border-danger hover:bg-danger-light"
                        size="sm"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
