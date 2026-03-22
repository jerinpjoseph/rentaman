'use client';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-tertiary text-text-secondary',
  success: 'bg-success-light text-success dark:text-green-400',
  warning: 'bg-warning-light text-warning dark:text-amber-400',
  danger: 'bg-danger-light text-danger dark:text-red-400',
  info: 'bg-info-light text-info dark:text-blue-400',
  purple: 'bg-purple-light text-purple dark:text-purple-400',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-text-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  purple: 'bg-purple',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

// Helper for booking status
export function getBookingStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    PENDING: 'warning',
    ACCEPTED: 'info',
    IN_PROGRESS: 'purple',
    COMPLETED: 'success',
    CANCELLED: 'danger',
  };
  return map[status] || 'default';
}

// Helper for verification status
export function getVerificationVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    PENDING: 'warning',
    VERIFIED: 'success',
    REJECTED: 'danger',
  };
  return map[status] || 'default';
}
