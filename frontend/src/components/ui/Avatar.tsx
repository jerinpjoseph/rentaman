'use client';

import { cn } from '@/lib/utils';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  fallback?: string;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export function Avatar({ src, alt = '', size = 'md', fallback, className = '' }: AvatarProps) {
  const initials = fallback || alt?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(sizeStyles[size], 'rounded-xl object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeStyles[size],
        'rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold',
        className
      )}
      aria-label={alt}
    >
      {initials}
    </div>
  );
}
