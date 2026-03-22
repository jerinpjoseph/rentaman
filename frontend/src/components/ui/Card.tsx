'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'elevated' | 'outlined';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  clickable?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-surface border border-border shadow-card',
  elevated: 'bg-surface-elevated shadow-elevated',
  outlined: 'bg-transparent border border-border',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6 sm:p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  className = '',
  children,
  onClick,
}: CardProps) {
  const baseClasses = cn(
    'rounded-2xl transition-all',
    variantStyles[variant],
    paddingStyles[padding],
    hoverable && 'hover:shadow-card-hover hover:-translate-y-0.5',
    clickable && 'cursor-pointer',
    className
  );

  if (hoverable || clickable) {
    return (
      <motion.div
        whileHover={hoverable ? { y: -2 } : undefined}
        whileTap={clickable ? { scale: 0.99 } : undefined}
        className={baseClasses}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
}
