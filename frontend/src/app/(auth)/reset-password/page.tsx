'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset link');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Reset Password</h1>
          <p className="text-sm text-text-secondary mt-1">Enter your new password</p>
        </div>

        <Card padding="lg">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle size={24} className="text-success" />
              </div>
              <p className="text-text-primary font-medium">Password reset successful!</p>
              <p className="text-sm text-text-secondary">Redirecting to login...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-danger-light text-danger p-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  leftIcon={<Lock size={16} />}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  leftIcon={<Lock size={16} />}
                />
                <Button type="submit" isLoading={loading} fullWidth size="lg">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
              <p className="text-center text-sm text-text-secondary mt-6">
                <Link href="/login" className="text-primary hover:text-primary-dark font-medium inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Back to login
                </Link>
              </p>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
