'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { WorkerProfile, PaginatedResponse } from '@/types';
import { MapPin, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonWorkerGrid } from '@/components/ui/Skeleton';

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({ city: '', skill: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchWorkers = (p = 1) => {
    setLoading(true);
    const params: Record<string, string | number> = { page: p, limit: 12 };
    if (search.city) params.city = search.city;
    if (search.skill) params.skills = search.skill;

    api.get<{ data: PaginatedResponse<WorkerProfile> }>('/workers', { params })
      .then((res) => {
        setWorkers(res.data.data.items);
        setTotalPages(res.data.data.meta.totalPages);
        setPage(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWorkers(1);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Find Workers</h1>
        <p className="text-sm text-text-secondary mt-1">Browse verified helpers in your area</p>
      </div>

      {/* Search */}
      <Card padding="md" className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="City..."
              value={search.city}
              onChange={(e) => setSearch({ ...search, city: e.target.value })}
              leftIcon={<MapPin size={16} />}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Skill (e.g. elderly care)..."
              value={search.skill}
              onChange={(e) => setSearch({ ...search, skill: e.target.value })}
              leftIcon={<Search size={16} />}
            />
          </div>
          <Button type="submit" leftIcon={<Search size={16} />} className="sm:self-end">
            Search
          </Button>
        </form>
      </Card>

      {loading ? (
        <SkeletonWorkerGrid count={6} />
      ) : workers.length === 0 ? (
        <EmptyState
          title="No workers found"
          description="Try adjusting your search filters."
          icon={<Search size={28} className="text-text-muted" />}
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker, i) => (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/workers/${worker.id}`}>
                  <Card hoverable clickable padding="md" className="h-full">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar
                        alt={`${worker.user.firstName} ${worker.user.lastName}`}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-primary truncate">
                          {worker.user.firstName} {worker.user.lastName}
                        </h3>
                        {worker.city && (
                          <p className="text-text-muted text-sm flex items-center gap-1 mt-0.5">
                            <MapPin size={12} />
                            {worker.city}{worker.state ? `, ${worker.state}` : ''}
                          </p>
                        )}
                        <div className="mt-1">
                          <StarRating value={Number(worker.avgRating)} readOnly size="sm" showValue />
                        </div>
                      </div>
                    </div>

                    {worker.bio && (
                      <p className="text-sm text-text-secondary mb-3 line-clamp-2">{worker.bio}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {worker.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="info" size="sm">{skill}</Badge>
                      ))}
                      {worker.skills.length > 3 && (
                        <Badge variant="default" size="sm">+{worker.skills.length - 3}</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
                      <span className="text-text-muted">{worker.experienceYears}yr exp</span>
                      <span className="font-semibold text-primary">${worker.hourlyRate}/hr</span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={fetchWorkers} />
        </>
      )}
    </div>
  );
}
