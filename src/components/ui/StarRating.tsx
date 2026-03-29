'use client';
import React, { useState } from 'react';


interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: number;
  showCount?: boolean;
  count?: number;
}

export default function StarRating({ value, onChange, readonly = false, size = 16, showCount = false, count = 0 }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const display = readonly ? value : (hovered || value);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={`star-${star}`}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform duration-100 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={star <= display ? '#F59E0B' : 'none'}
            stroke={star <= display ? '#F59E0B' : '#D1D5DB'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
      {showCount && (
        <span className="text-xs text-gray-500 ml-1 tabular-nums">({count.toLocaleString()})</span>
      )}
    </div>
  );
}