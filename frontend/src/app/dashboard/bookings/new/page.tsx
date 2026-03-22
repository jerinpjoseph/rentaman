'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth.store';
import { useRazorpay } from '@/hooks/useRazorpay';
import api from '@/lib/api';
import type { WorkerProfile } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Stepper } from '@/components/ui/Stepper';
import { StarRating } from '@/components/ui/StarRating';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { toast } from '@/store/toast.store';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Check,
  Search,
  User,
  CreditCard,
  CheckCircle,
  IndianRupee,
} from 'lucide-react';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
}

const steps = [
  { label: 'Select Worker', description: 'Choose your helper' },
  { label: 'Service Details', description: 'What do you need?' },
  { label: 'Schedule & Location', description: 'When and where?' },
  { label: 'Payment', description: 'Secure payment' },
  { label: 'Confirmed', description: 'Booking complete' },
];

const durationOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => ({
  value: String(h),
  label: `${h} hour${h > 1 ? 's' : ''}`,
}));

export default function NewBookingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { initiatePayment } = useRazorpay();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  // Commission
  const [commissionPercent, setCommissionPercent] = useState(15);

  // Worker selection state
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [workerSearch, setWorkerSearch] = useState({ city: '', skills: '' });
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    scheduledDate: '',
    scheduledTime: '',
    durationHours: 2,
    address: '',
    city: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    notes: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    api.get<{ data: ServiceCategory[] }>('/bookings/categories')
      .then((res) => setCategories(res.data.data))
      .catch(() => {});
  }, []);

  // Load workers on mount
  useEffect(() => {
    fetchWorkers();
  }, []);

  // Fetch commission rate
  useEffect(() => {
    api.get('/config/commission')
      .then((res) => {
        const data = res.data.data || res.data;
        if (data?.commissionPercent != null) setCommissionPercent(data.commissionPercent);
      })
      .catch(() => {});
  }, []);

  const fetchWorkers = useCallback(async () => {
    setLoadingWorkers(true);
    try {
      const params: Record<string, string> = { limit: '20' };
      if (workerSearch.city) params.city = workerSearch.city;
      if (workerSearch.skills) params.skills = workerSearch.skills;
      const res = await api.get('/workers', { params });
      setWorkers((res.data.data?.items || res.data?.items || []) as WorkerProfile[]);
    } catch {
      setWorkers([]);
    } finally {
      setLoadingWorkers(false);
    }
  }, [workerSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'durationHours' ? Number(value) : value }));
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng, address: address || prev.address }));
  };

  const validateStep = (step: number): boolean => {
    if (step === 0) return !!selectedWorker;
    if (step === 1) return !!form.title;
    if (step === 2) return !!form.scheduledDate && !!form.scheduledTime && !!form.address && !!form.city;
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const totalAmount = selectedWorker
    ? Number(selectedWorker.hourlyRate) * form.durationHours
    : 0;
  const platformFee = Math.round((totalAmount * commissionPercent) / 100);
  const workerEarnings = totalAmount - platformFee;

  const handlePayment = async () => {
    setError('');
    setSubmitting(true);
    try {
      // Step 1: Create the booking
      const payload: Record<string, any> = {
        title: form.title,
        workerId: selectedWorker!.userId,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        durationHours: form.durationHours,
        address: form.address,
        city: form.city,
      };
      if (form.description) payload.description = form.description;
      if (form.categoryId) payload.categoryId = form.categoryId;
      if (form.notes) payload.notes = form.notes;
      if (form.latitude !== undefined) payload.latitude = form.latitude;
      if (form.longitude !== undefined) payload.longitude = form.longitude;

      const bookingRes = await api.post('/bookings', payload);
      const booking = bookingRes.data.data || bookingRes.data;
      const bookingId = booking.id;

      // Step 2: Initiate Razorpay payment
      initiatePayment({
        bookingId,
        onSuccess: () => {
          setCreatedBookingId(bookingId);
          setCurrentStep(4); // Confirmation step
          setSubmitting(false);
          toast('success', 'Payment Successful', 'Your booking has been confirmed!');
        },
        onFailure: (err) => {
          setError(err);
          setSubmitting(false);
          // Booking created but payment failed - user can retry from dashboard
          toast('error', 'Payment Failed', err);
        },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking');
      setSubmitting(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h1 className="text-2xl font-bold text-text-primary mb-2">Create New Booking</h1>
      <p className="text-sm text-text-secondary mb-8">Find a helper and book their service</p>

      <Stepper steps={steps} currentStep={currentStep} className="mb-8" />

      {error && (
        <div className="bg-danger-light text-danger p-3 rounded-xl mb-4 text-sm">{error}</div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 0: Select Worker */}
        {currentStep === 0 && (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card padding="lg" className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-text-primary">Select a Worker</h2>
                  <p className="text-xs text-text-muted">Choose who you want to hire</p>
                </div>
              </div>

              {/* Search filters */}
              <div className="flex gap-3">
                <Input
                  placeholder="Filter by city..."
                  value={workerSearch.city}
                  onChange={(e) => setWorkerSearch((s) => ({ ...s, city: e.target.value }))}
                  leftIcon={<MapPin size={14} />}
                />
                <Input
                  placeholder="Filter by skills..."
                  value={workerSearch.skills}
                  onChange={(e) => setWorkerSearch((s) => ({ ...s, skills: e.target.value }))}
                  leftIcon={<Search size={14} />}
                />
                <Button type="button" variant="secondary" onClick={fetchWorkers} className="shrink-0">
                  Search
                </Button>
              </div>

              {/* Worker list */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {loadingWorkers ? (
                  <div className="text-center py-8 text-text-secondary text-sm">Loading workers...</div>
                ) : workers.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary text-sm">No workers found. Try adjusting filters.</div>
                ) : (
                  workers.map((worker) => (
                    <div
                      key={worker.id}
                      onClick={() => setSelectedWorker(worker)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedWorker?.id === worker.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <Avatar alt={`${worker.user.firstName} ${worker.user.lastName}`} src={worker.user.avatar} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary">
                            {worker.user.firstName} {worker.user.lastName}
                          </span>
                          {worker.verificationStatus === 'VERIFIED' && (
                            <Badge variant="success" size="sm">Verified</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <StarRating value={Number(worker.avgRating)} readOnly size="sm" />
                          <span className="text-xs text-text-muted">({worker.totalReviews})</span>
                          {worker.city && (
                            <span className="text-xs text-text-muted flex items-center gap-1">
                              <MapPin size={10} /> {worker.city}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {worker.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="default" size="sm">{skill}</Badge>
                          ))}
                          {worker.skills.length > 3 && (
                            <Badge variant="default" size="sm">+{worker.skills.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-primary flex items-center">
                          <IndianRupee size={14} />{Number(worker.hourlyRate)}
                        </div>
                        <span className="text-xs text-text-muted">/hour</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 1: Service Details */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card padding="lg" className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-text-primary">Service Details</h2>
                  <p className="text-xs text-text-muted">Tell us what you need help with</p>
                </div>
              </div>

              <Input
                label="Title"
                name="title"
                required
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., Hospital visit companion needed"
              />

              {categories.length > 0 && (
                <Select
                  label="Service Category"
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  placeholder="Select a category (optional)"
                  options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                />
              )}

              <Textarea
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe what you need help with..."
              />
            </Card>
          </motion.div>
        )}

        {/* Step 2: Schedule & Location */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card padding="lg" className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Calendar size={18} className="text-accent" />
                </div>
                <div>
                  <h2 className="font-semibold text-text-primary">Schedule & Location</h2>
                  <p className="text-xs text-text-muted">When and where do you need help?</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date"
                  name="scheduledDate"
                  type="date"
                  required
                  value={form.scheduledDate}
                  onChange={handleChange}
                  leftIcon={<Calendar size={16} />}
                />
                <Input
                  label="Time"
                  name="scheduledTime"
                  type="time"
                  required
                  value={form.scheduledTime}
                  onChange={handleChange}
                  leftIcon={<Clock size={16} />}
                />
              </div>

              <Select
                label="Duration"
                name="durationHours"
                value={String(form.durationHours)}
                onChange={handleChange}
                options={durationOptions}
              />

              {/* Calculated total with fee breakdown */}
              {selectedWorker && (
                <div className="bg-primary/5 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <span>Service ({form.durationHours}h x {'\u20B9'}{Number(selectedWorker.hourlyRate)}/h)</span>
                    <span>{'\u20B9'}{totalAmount.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Platform fee ({commissionPercent}%)</span>
                    <span>{'\u20B9'}{platformFee}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">Total</span>
                    <span className="text-xl font-bold text-primary flex items-center">
                      <IndianRupee size={16} />{totalAmount.toFixed(0)}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Select Location
                </label>
                <div className="rounded-xl overflow-hidden border border-border">
                  <MapPicker
                    latitude={form.latitude}
                    longitude={form.longitude}
                    onLocationSelect={handleLocationSelect}
                  />
                </div>
              </div>

              <Input
                label="Address"
                name="address"
                required
                value={form.address}
                onChange={handleChange}
                placeholder="Full address"
                leftIcon={<MapPin size={16} />}
              />

              <Input
                label="City"
                name="city"
                required
                value={form.city}
                onChange={handleChange}
                placeholder="City"
              />

              <Textarea
                label="Additional Notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any special requirements..."
              />
            </Card>
          </motion.div>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card padding="lg" className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <CreditCard size={18} className="text-warning" />
                </div>
                <div>
                  <h2 className="font-semibold text-text-primary">Review & Pay</h2>
                  <p className="text-xs text-text-muted">Confirm your booking and make payment</p>
                </div>
              </div>

              {/* Order summary */}
              <div className="space-y-3">
                <SummaryRow label="Worker" value={selectedWorker ? `${selectedWorker.user.firstName} ${selectedWorker.user.lastName}` : '-'} />
                <SummaryRow label="Title" value={form.title} />
                {selectedCategory && <SummaryRow label="Category" value={selectedCategory.name} />}
                {form.description && <SummaryRow label="Description" value={form.description} />}
                <SummaryRow label="Date" value={form.scheduledDate} />
                <SummaryRow label="Time" value={form.scheduledTime} />
                <SummaryRow label="Duration" value={`${form.durationHours} hour${form.durationHours > 1 ? 's' : ''}`} />
                <SummaryRow label="Address" value={form.address} />
                <SummaryRow label="City" value={form.city} />
                {form.notes && <SummaryRow label="Notes" value={form.notes} />}
              </div>

              {/* Total with fee breakdown */}
              <div className="bg-primary/5 rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between text-sm text-text-secondary">
                  <span>Service ({form.durationHours}h x {'\u20B9'}{selectedWorker ? Number(selectedWorker.hourlyRate) : 0}/h)</span>
                  <span>{'\u20B9'}{totalAmount.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-text-muted">
                  <span>Platform fee ({commissionPercent}%)</span>
                  <span>{'\u20B9'}{platformFee}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>Worker earnings</span>
                  <span>{'\u20B9'}{workerEarnings}</span>
                </div>
                <div className="border-t border-border pt-2 flex items-center justify-between">
                  <span className="text-base font-medium text-text-primary">Total Amount</span>
                  <span className="text-2xl font-bold text-primary flex items-center">
                    <IndianRupee size={20} />{totalAmount.toFixed(0)}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                fullWidth
                size="lg"
                isLoading={submitting}
                onClick={handlePayment}
                leftIcon={<CreditCard size={18} />}
              >
                {submitting ? 'Processing...' : `Pay ${'\u20B9'}${totalAmount.toFixed(0)}`}
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card padding="lg" className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-success" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-text-primary">Booking Confirmed!</h2>
                <p className="text-text-secondary mt-2">
                  Your booking has been created and payment received.
                  The worker will be notified shortly.
                </p>
              </div>

              <div className="bg-surface-alt rounded-xl p-4 text-left space-y-2">
                <SummaryRow label="Worker" value={selectedWorker ? `${selectedWorker.user.firstName} ${selectedWorker.user.lastName}` : '-'} />
                <SummaryRow label="Service" value={form.title} />
                <SummaryRow label="Date" value={`${form.scheduledDate} at ${form.scheduledTime}`} />
                <SummaryRow label="Amount Paid" value={`\u20B9${totalAmount.toFixed(0)}`} />
              </div>

              <div className="flex gap-3 justify-center">
                {createdBookingId && (
                  <Button onClick={() => router.push(`/dashboard/bookings/${createdBookingId}`)}>
                    View Booking
                  </Button>
                )}
                <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation - hide on confirmation step */}
      {currentStep < 3 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={currentStep === 0 ? () => router.back() : handleBack}
            leftIcon={<ArrowLeft size={16} />}
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={!validateStep(currentStep)}
            rightIcon={<ArrowRight size={16} />}
          >
            Continue
          </Button>
        </div>
      )}

      {currentStep === 3 && (
        <div className="flex items-center justify-start mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back
          </Button>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text-primary text-right max-w-[60%]">{value}</span>
    </div>
  );
}
