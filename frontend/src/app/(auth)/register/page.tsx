'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { User, Briefcase, Mail, Lock, Phone } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({
    email: '',
    phone: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'CUSTOMER' as 'CUSTOMER' | 'WORKER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
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
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">R</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
          <p className="text-sm text-text-secondary mt-1">Join RentAMan today</p>
        </div>

        <Card padding="lg">
          {error && (
            <div className="bg-danger-light text-danger p-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-3">I want to</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'CUSTOMER' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                  ${form.role === 'CUSTOMER'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-text-secondary hover:border-text-muted'
                  }`}
              >
                <User size={24} />
                <span className="text-sm font-medium">Book Helpers</span>
                <span className="text-xs text-text-muted">Customer</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'WORKER' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                  ${form.role === 'WORKER'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-text-secondary hover:border-text-muted'
                  }`}
              >
                <Briefcase size={24} />
                <span className="text-sm font-medium">Be a Helper</span>
                <span className="text-xs text-text-muted">Worker</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                name="firstName"
                required
                value={form.firstName}
                onChange={handleChange}
                placeholder="John"
              />
              <Input
                label="Last Name"
                name="lastName"
                required
                value={form.lastName}
                onChange={handleChange}
                placeholder="Doe"
              />
            </div>
            <Input
              label="Email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="john@example.com"
              leftIcon={<Mail size={16} />}
            />
            <Input
              label="Phone"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              placeholder="+919876543210"
              leftIcon={<Phone size={16} />}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              placeholder="Min 8 characters"
              leftIcon={<Lock size={16} />}
            />
            <Button type="submit" isLoading={loading} fullWidth size="lg">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
