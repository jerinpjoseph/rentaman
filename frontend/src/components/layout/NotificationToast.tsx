'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { toast } from '@/store/toast.store';
import { ToastContainer } from '@/components/ui/Toast';

export function NotificationToast() {
  const { on } = useSocket();

  useEffect(() => {
    const cleanup1 = on('notification:new', (data: { message: string }) => {
      toast('info', 'New Notification', data.message);
    });

    const cleanup2 = on('booking:statusUpdate', (data: any) => {
      const status = data?.status || data?.data?.status || '';
      toast('info', 'Booking Updated', `Status changed to ${String(status).replace('_', ' ')}`);
    });

    const cleanup3 = on('booking:new', (data: any) => {
      const title = data?.title || 'a service';
      toast('info', 'New Booking', `You have a new booking request: ${title}`);
    });

    return () => {
      cleanup1?.();
      cleanup2?.();
      cleanup3?.();
    };
  }, [on]);

  return <ToastContainer />;
}
