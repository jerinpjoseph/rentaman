'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  showValue?: boolean;
}

const sizeMap = { sm: 14, md: 18, lg: 24 };

export function StarRating({
  value,
  onChange,
  size = 'md',
  readOnly = false,
  showValue = false,
}: StarRatingProps) {
  const iconSize = sizeMap[size];

  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            size={iconSize}
            className={star <= value ? 'fill-warning text-warning' : 'fill-none text-border'}
          />
        </button>
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-text-secondary">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
