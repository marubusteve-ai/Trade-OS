/**
 * Reusable Loading Spinner & Skeleton States
 */

import React from 'react';
import { cn } from '../../lib/utils';

export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}> = ({ size = 'md', className, label }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-3',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-emerald-500/20 border-t-emerald-400',
          sizeClasses[size]
        )}
      />
      {label && <span className="text-xs text-[#848B98] font-mono">{label}</span>}
    </div>
  );
};

export const Skeleton: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[#22252A]/60 dark:bg-[#22252A]/60 light:bg-[#E5E7EB]',
        className
      )}
    />
  );
};
