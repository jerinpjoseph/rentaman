'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import type { User, WorkerProfile } from '@/types';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge, getVerificationVariant } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { Skeleton } from '@/components/ui/Skeleton';
import { FileUpload } from '@/components/ui/FileUpload';
import { toast } from '@/store/toast.store';
import { Mail, Phone, Shield } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '' });
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [workerForm, setWorkerForm] = useState({
    bio: '',
    skills: '',
    hourlyRate: 200,
    experienceYears: 0,
    city: '',
    state: '',
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    api.get<{ data: User }>('/users/me').then((res) => {
      const u = res.data.data;
      setProfile({ firstName: u.firstName, lastName: u.lastName, phone: u.phone });
    });

    if (user?.role === 'WORKER') {
      api.get<{ data: WorkerProfile | null }>('/workers/me').then((res) => {
        const wp = res.data.data;
        if (!wp) return;
        setWorkerProfile(wp);
        setWorkerForm({
          bio: wp.bio || '',
          skills: wp.skills.join(', '),
          hourlyRate: wp.hourlyRate,
          experienceYears: wp.experienceYears,
          city: wp.city || '',
          state: wp.state || '',
        });
      }).catch(() => {});
    }
  }, [isAuthenticated, user?.role]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/me', profile);
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ ...u, ...profile }));
      }
      toast('success', 'Profile Updated', 'Your changes have been saved.');
    } catch (err: any) {
      toast('error', 'Error', err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const saveWorkerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...workerForm,
        skills: workerForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (workerProfile) {
        await api.patch('/workers/profile', payload);
      } else {
        await api.post('/workers/profile', payload);
      }
      toast('success', 'Saved', 'Worker profile saved successfully.');
    } catch (err: any) {
      toast('error', 'Error', err.response?.data?.message || 'Failed to save worker profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" rounded="2xl" />
      </div>
    );
  }

  const tabs = [
    { label: 'Basic Info', value: 'basic' },
    ...(user?.role === 'WORKER' ? [{ label: 'Worker Profile', value: 'worker' }] : []),
  ];

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">My Profile</h1>

      {/* Profile Header */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-4">
          <FileUpload
            variant="avatar"
            label="Change avatar"
            accept="image/jpeg,image/png"
            maxSizeMB={5}
            preview={user?.avatar || null}
            onUpload={async (file) => {
              const formData = new FormData();
              formData.append('file', file);
              const res = await api.post('/uploads/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              const avatarUrl = res.data?.data?.avatarUrl || res.data?.avatarUrl;
              const stored = localStorage.getItem('user');
              if (stored) {
                const u = JSON.parse(stored);
                localStorage.setItem('user', JSON.stringify({ ...u, avatar: avatarUrl }));
              }
              toast('success', 'Avatar Updated', 'Your profile photo has been changed.');
            }}
          />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {user?.firstName} {user?.lastName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="info">{user?.role}</Badge>
              {workerProfile && (
                <Badge variant={getVerificationVariant(workerProfile.verificationStatus)} dot>
                  {workerProfile.verificationStatus}
                </Badge>
              )}
            </div>
            {workerProfile && (
              <div className="mt-2">
                <StarRating value={Number(workerProfile.avgRating)} readOnly size="sm" showValue />
                <span className="text-xs text-text-muted ml-1">({workerProfile.totalReviews} reviews)</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      {tabs.length > 1 && (
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />
      )}

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'basic' && (
          <Card padding="lg">
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
                <Input
                  label="Last Name"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </div>
              <Input
                label="Phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                leftIcon={<Phone size={16} />}
              />
              <Input
                label="Email"
                value={user?.email || ''}
                disabled
                leftIcon={<Mail size={16} />}
              />
              <Input
                label="Role"
                value={user?.role || ''}
                disabled
                leftIcon={<Shield size={16} />}
              />
              <Button type="submit" isLoading={saving}>
                Save Changes
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'worker' && user?.role === 'WORKER' && (
          <Card padding="lg">
            <form onSubmit={saveWorkerProfile} className="space-y-4">
              <Textarea
                label="Bio"
                value={workerForm.bio}
                onChange={(e) => setWorkerForm({ ...workerForm, bio: e.target.value })}
                placeholder="Tell clients about yourself..."
              />
              <Input
                label="Skills (comma-separated)"
                value={workerForm.skills}
                onChange={(e) => setWorkerForm({ ...workerForm, skills: e.target.value })}
                placeholder="e.g., elderly care, hospital visit, pet care"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Hourly Rate ($)"
                  type="number"
                  value={String(workerForm.hourlyRate)}
                  onChange={(e) => setWorkerForm({ ...workerForm, hourlyRate: Number(e.target.value) })}
                />
                <Input
                  label="Experience (years)"
                  type="number"
                  value={String(workerForm.experienceYears)}
                  onChange={(e) => setWorkerForm({ ...workerForm, experienceYears: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={workerForm.city}
                  onChange={(e) => setWorkerForm({ ...workerForm, city: e.target.value })}
                />
                <Input
                  label="State"
                  value={workerForm.state}
                  onChange={(e) => setWorkerForm({ ...workerForm, state: e.target.value })}
                />
              </div>
              <Button type="submit" isLoading={saving}>
                {workerProfile ? 'Update Worker Profile' : 'Create Worker Profile'}
              </Button>
            </form>

            {workerProfile && (
              <div className="mt-6 pt-6 border-t border-border">
                <FileUpload
                  label="ID Proof Document"
                  accept="image/jpeg,image/png,application/pdf"
                  maxSizeMB={5}
                  onUpload={async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    await api.post('/uploads/id-proof', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    toast('success', 'ID Proof Uploaded', 'Your document is pending verification.');
                  }}
                />
              </div>
            )}
          </Card>
        )}
      </motion.div>
    </div>
  );
}
