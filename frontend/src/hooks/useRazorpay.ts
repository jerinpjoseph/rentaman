'use client';

import { useCallback } from 'react';
import api from '@/lib/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  bookingId: string;
  onSuccess: (bookingData: any) => void;
  onFailure: (error: string) => void;
}

export function useRazorpay() {
  const initiatePayment = useCallback(async ({ bookingId, onSuccess, onFailure }: RazorpayOptions) => {
    try {
      // Step 1: Create Razorpay order
      const { data } = await api.post('/payments', { bookingId });
      const order = data.data || data;

      if (!window.Razorpay) {
        onFailure('Payment gateway not loaded. Please refresh and try again.');
        return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'RentAMan',
        description: `Payment for booking`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            // Step 3: Verify payment on backend
            const { data: verifyData } = await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            onSuccess(verifyData.data || verifyData);
          } catch {
            onFailure('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            onFailure('Payment was cancelled');
          },
        },
        theme: {
          color: '#6366f1',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        onFailure(response.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (err: any) {
      onFailure(err.response?.data?.message || 'Failed to initiate payment');
    }
  }, []);

  return { initiatePayment };
}
