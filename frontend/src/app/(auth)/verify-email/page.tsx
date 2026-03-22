'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    api.post('/auth/verify-email', { token })
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      });
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card padding="lg">
          <div className="text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 size={48} className="text-primary mx-auto animate-spin" />
                <p className="text-text-primary font-medium">Verifying your email...</p>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-success" />
                </div>
                <p className="text-text-primary font-medium">{message}</p>
                <Link href="/login">
                  <Button size="lg">Go to Login</Button>
                </Link>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
                  <XCircle size={32} className="text-danger" />
                </div>
                <p className="text-text-primary font-medium">{message}</p>
                <Link href="/login">
                  <Button variant="secondary" size="lg">Back to Login</Button>
                </Link>
              </>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
