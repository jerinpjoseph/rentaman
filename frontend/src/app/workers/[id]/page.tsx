'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import type { WorkerProfile, Review, PaginatedResponse } from '@/types';
import { MapPin, ArrowLeft, CheckCircle, Briefcase, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge, getVerificationVariant } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

export default function WorkerDetailPage() {
  const { id } = useParams();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<{ data: WorkerProfile }>(`/workers/${id}`),
      api.get<{ data: PaginatedResponse<Review> }>(`/reviews/worker/${id}`, { params: { limit: 20 } }),
    ])
      .then(([workerRes, reviewsRes]) => {
        setWorker(workerRes.data.data);
        setReviews(reviewsRes.data.data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-6 w-24" />
        <SkeletonCard />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="p-6">
        <EmptyState title="Worker not found" description="This worker profile doesn't exist." />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <Link
        href="/workers"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Workers
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Hero Header */}
        <Card padding="lg">
          <div className="flex flex-col sm:flex-row gap-6">
            <Avatar
              alt={`${worker.user.firstName} ${worker.user.lastName}`}
              size="xl"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-text-primary">
                  {worker.user.firstName} {worker.user.lastName}
                </h1>
                {worker.verificationStatus === 'VERIFIED' && (
                  <Badge variant="success" dot>Verified</Badge>
                )}
                {worker.verificationStatus === 'PENDING' && (
                  <Badge variant="warning" dot>Pending</Badge>
                )}
              </div>
              {worker.city && (
                <p className="text-text-secondary flex items-center gap-1 mt-1">
                  <MapPin size={14} />
                  {worker.city}{worker.state ? `, ${worker.state}` : ''}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3">
                <StarRating value={Number(worker.avgRating)} readOnly showValue />
                <span className="text-sm text-text-muted">({worker.totalReviews} reviews)</span>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <span className="text-2xl font-bold text-primary">
                  ${worker.hourlyRate}<span className="text-sm font-normal text-text-muted">/hr</span>
                </span>
                <Badge variant={worker.isAvailable ? 'success' : 'danger'} dot>
                  {worker.isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Bio */}
        {worker.bio && (
          <Card padding="md">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">About</h2>
            <p className="text-text-secondary leading-relaxed">{worker.bio}</p>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card padding="md" className="text-center">
            <Clock size={20} className="mx-auto text-primary mb-2" />
            <p className="text-xl font-bold text-text-primary">{worker.experienceYears}</p>
            <p className="text-xs text-text-muted">Years Exp.</p>
          </Card>
          <Card padding="md" className="text-center">
            <Briefcase size={20} className="mx-auto text-accent mb-2" />
            <p className="text-xl font-bold text-text-primary">{worker.totalBookings}</p>
            <p className="text-xs text-text-muted">Bookings</p>
          </Card>
          <Card padding="md" className="text-center">
            <CheckCircle size={20} className="mx-auto text-success mb-2" />
            <p className="text-xl font-bold text-text-primary">{Number(worker.avgRating).toFixed(1)}</p>
            <p className="text-xs text-text-muted">Rating</p>
          </Card>
        </div>

        {/* Skills */}
        {worker.skills.length > 0 && (
          <Card padding="md">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((skill) => (
                <Badge key={skill} variant="info" size="md">{skill}</Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Reviews */}
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-4">Reviews ({worker.totalReviews})</h2>
          {reviews.length === 0 ? (
            <Card padding="md">
              <p className="text-text-muted text-sm">No reviews yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card padding="md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar
                          alt={`${review.reviewer.firstName} ${review.reviewer.lastName}`}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {review.reviewer.firstName} {review.reviewer.lastName}
                          </p>
                          <StarRating value={review.rating} readOnly size="sm" />
                        </div>
                      </div>
                      <span className="text-xs text-text-muted">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-text-secondary mt-2">{review.comment}</p>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
