'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
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
          <h1 className="text-2xl font-bold text-text-primary">Forgot Password</h1>
          <p className="text-sm text-text-secondary mt-1">
            Enter your email to receive a reset link
          </p>
        </div>

        <Card padding="lg">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <Mail size={24} className="text-success" />
              </div>
              <p className="text-text-primary font-medium">Check your email</p>
              <p className="text-sm text-text-secondary">
                If an account exists with that email, we&apos;ve sent a password reset link.
              </p>
              <Link href="/login" className="text-primary hover:text-primary-dark text-sm font-medium inline-flex items-center gap-1">
                <ArrowLeft size={14} /> Back to login
              </Link>
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
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  leftIcon={<Mail size={16} />}
                />
                <Button type="submit" isLoading={loading} fullWidth size="lg">
                  {loading ? 'Sending...' : 'Send Reset Link'}
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
