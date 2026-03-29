import React from 'react';

type BadgeVariant = 'pdf' | 'docx' | 'ppt' | 'active' | 'pending' | 'flagged' | 'contributor' | 'admin' | 'guest' | 'new' | 'trending' | 'ai';

const variantStyles: Record<BadgeVariant, string> = {
  pdf: 'bg-red-100 text-red-700 border border-red-200',
  docx: 'bg-blue-100 text-blue-700 border border-blue-200',
  ppt: 'bg-orange-100 text-orange-700 border border-orange-200',
  active: 'bg-green-100 text-green-700 border border-green-200',
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  flagged: 'bg-red-100 text-red-700 border border-red-200',
  contributor: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  admin: 'bg-purple-100 text-purple-700 border border-purple-200',
  guest: 'bg-gray-100 text-gray-600 border border-gray-200',
  new: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  trending: 'bg-pink-100 text-pink-700 border border-pink-200',
  ai: 'bg-violet-100 text-violet-700 border border-violet-200',
};

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

export default function Badge({ variant, label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium font-display ${variantStyles[variant]} ${className}`}>
      {label}
    </span>
  );
}