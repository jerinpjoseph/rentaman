'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import type { Booking } from '@/types';
import { ArrowLeft, MapPin, Calendar, Clock, DollarSign, IndianRupee, User, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, getBookingStatusVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { StarRating } from '@/components/ui/StarRating';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/store/toast.store';

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const statusFlow = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  const fetchBooking = () => {
    api.get<{ data: Booking }>(`/bookings/${id}`)
      .then((res) => setBooking(res.data.data))
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated && id) fetchBooking();
  }, [isAuthenticated, id]);

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast('success', 'Status Updated', `Booking is now ${status.replace('_', ' ').toLowerCase()}`);
      fetchBooking();
    } catch (err: any) {
      toast('error', 'Error', err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/reviews', { bookingId: id, ...reviewForm });
      setShowReview(false);
      toast('success', 'Review Submitted', 'Thank you for your feedback!');
      fetchBooking();
    } catch (err: any) {
      toast('error', 'Error', err.response?.data?.message || 'Failed to submit review');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-24" />
        <Card padding="lg" className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </Card>
      </div>
    );
  }

  if (!booking) return null;

  const isCustomer = user?.id === booking.customerId;
  const isWorker = user?.id === booking.workerId;
  const currentStatusIndex = statusFlow.indexOf(booking.status);

  const handleChat = async () => {
    const otherUserId = isCustomer ? booking.workerId : booking.customerId;
    if (!otherUserId) return;
    try {
      const { data } = await api.post('/chat/conversations', {
        participantId: otherUserId,
        bookingId: booking.id,
      });
      const conversation = data.data || data;
      router.push(`/dashboard/chat/${conversation.id}`);
    } catch (err: any) {
      toast('error', 'Error', err.response?.data?.message || 'Failed to start chat');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Header */}
        <Card padding="lg">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
            <div>
              <h1 className="text-xl font-bold text-text-primary">{booking.title}</h1>
              <p className="text-sm text-text-muted mt-1">Booking #{booking.id.slice(0, 8)}</p>
            </div>
            <Badge variant={getBookingStatusVariant(booking.status)} size="md" dot>
              {statusLabels[booking.status] || booking.status}
            </Badge>
          </div>

          {/* Status Timeline */}
          {booking.status !== 'CANCELLED' && (
            <div className="flex items-center gap-1 mb-6">
              {statusFlow.map((step, i) => (
                <div key={step} className="flex items-center flex-1 last:flex-initial">
                  <div
                    className={`w-full h-1.5 rounded-full transition-colors
                      ${i <= currentStatusIndex ? 'bg-primary' : 'bg-border'}`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Details */}
          {booking.description && (
            <p className="text-text-secondary mb-4">{booking.description}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <InfoItem icon={<Calendar size={16} />} label="Date" value={new Date(booking.scheduledDate).toLocaleDateString()} />
            <InfoItem icon={<Clock size={16} />} label="Time" value={`${booking.scheduledTime} (${booking.durationHours}h)`} />
            <InfoItem icon={<MapPin size={16} />} label="Location" value={`${booking.address}, ${booking.city}`} />
            {booking.totalAmount != null && (
              <InfoItem icon={<IndianRupee size={16} />} label="Total Amount" value={`\u20B9${booking.totalAmount}`} />
            )}
            {booking.platformFee != null && isWorker && (
              <InfoItem icon={<IndianRupee size={16} />} label="Your Earnings" value={`\u20B9${booking.netAmount}`} />
            )}
            {booking.platformFee != null && isCustomer && (
              <InfoItem icon={<IndianRupee size={16} />} label={`Platform Fee (${booking.platformFeePercent}%)`} value={`\u20B9${booking.platformFee}`} />
            )}
            {booking.platformFee != null && !isWorker && !isCustomer && (
              <>
                <InfoItem icon={<IndianRupee size={16} />} label={`Platform Fee (${booking.platformFeePercent}%)`} value={`\u20B9${booking.platformFee}`} />
                <InfoItem icon={<IndianRupee size={16} />} label="Worker Earnings" value={`\u20B9${booking.netAmount}`} />
              </>
            )}
          </div>

          {booking.notes && (
            <div className="mt-4 p-3 bg-surface-secondary rounded-xl">
              <p className="text-xs font-medium text-text-muted mb-1">Notes</p>
              <p className="text-sm text-text-secondary">{booking.notes}</p>
            </div>
          )}
        </Card>

        {/* People */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card padding="md">
            <p className="text-xs font-medium text-text-muted mb-3">Customer</p>
            <div className="flex items-center gap-3">
              <Avatar
                alt={`${booking.customer.firstName} ${booking.customer.lastName}`}
                size="md"
              />
              <div>
                <p className="font-medium text-text-primary">{booking.customer.firstName} {booking.customer.lastName}</p>
                <p className="text-xs text-text-muted">Customer</p>
              </div>
            </div>
          </Card>
          {booking.worker && (
            <Card padding="md">
              <p className="text-xs font-medium text-text-muted mb-3">Worker</p>
              <div className="flex items-center gap-3">
                <Avatar
                  alt={`${booking.worker.firstName} ${booking.worker.lastName}`}
                  size="md"
                />
                <div>
                  <p className="font-medium text-text-primary">{booking.worker.firstName} {booking.worker.lastName}</p>
                  <p className="text-xs text-text-muted">Worker</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Actions */}
        <Card padding="md">
          <div className="flex flex-wrap gap-3">
            {booking.worker && booking.status !== 'CANCELLED' && (isCustomer || isWorker) && (
              <Button variant="outline" onClick={handleChat} leftIcon={<MessageSquare size={16} />}>
                Chat with {isCustomer ? 'Worker' : 'Customer'}
              </Button>
            )}
            {isWorker && booking.status === 'PENDING' && (
              <>
                <Button onClick={() => updateStatus('ACCEPTED')} isLoading={actionLoading}>
                  Accept Job
                </Button>
                <Button variant="danger" onClick={() => updateStatus('CANCELLED')} isLoading={actionLoading}>
                  Decline
                </Button>
              </>
            )}
            {isWorker && booking.status === 'ACCEPTED' && (
              <Button onClick={() => updateStatus('IN_PROGRESS')} isLoading={actionLoading}
                className="bg-purple text-white hover:bg-purple-700">
                Start Job
              </Button>
            )}
            {isWorker && booking.status === 'IN_PROGRESS' && (
              <Button onClick={() => updateStatus('COMPLETED')} isLoading={actionLoading}
                className="bg-success text-white hover:bg-green-600">
                Mark Complete
              </Button>
            )}
            {isCustomer && booking.status === 'PENDING' && (
              <Button variant="danger" onClick={() => updateStatus('CANCELLED')} isLoading={actionLoading}>
                Cancel Booking
              </Button>
            )}
            {isCustomer && booking.status === 'COMPLETED' && !booking.review && (
              <Button onClick={() => setShowReview(true)}
                className="bg-warning text-white hover:bg-amber-600">
                Leave Review
              </Button>
            )}
            {!isWorker && !isCustomer && booking.status !== 'CANCELLED' && (
              <p className="text-sm text-text-muted">No actions available</p>
            )}
            {booking.status === 'CANCELLED' && (
              <p className="text-sm text-text-muted">This booking has been cancelled</p>
            )}
            {booking.status === 'COMPLETED' && booking.review && (
              <p className="text-sm text-text-muted">This booking is complete</p>
            )}
          </div>
        </Card>

        {/* Review Display */}
        {booking.review && (
          <Card padding="md" className="bg-warning/5 border-warning/20">
            <p className="text-xs font-medium text-text-muted mb-2">Review</p>
            <StarRating value={booking.review.rating} readOnly size="md" />
            {booking.review.comment && (
              <p className="text-sm text-text-secondary mt-2">{booking.review.comment}</p>
            )}
          </Card>
        )}
      </motion.div>

      {/* Review Modal */}
      <Modal
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        title="Leave a Review"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowReview(false)}>Cancel</Button>
            <Button onClick={submitReview} isLoading={actionLoading}>Submit Review</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Rating</label>
            <StarRating
              value={reviewForm.rating}
              onChange={(v) => setReviewForm((prev) => ({ ...prev, rating: v }))}
              size="lg"
            />
          </div>
          <Textarea
            label="Comment"
            value={reviewForm.comment}
            onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
            placeholder="Share your experience..."
          />
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-surface-secondary rounded-xl">
      <div className="text-text-muted mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}
