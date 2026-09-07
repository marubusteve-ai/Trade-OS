import React, { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'rose' | 'amber' | 'blue' | 'purple' | 'zinc' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'zinc',
  size = 'sm',
  children,
  ...props
}) => {
  const variants = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 font-medium',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/25 font-medium',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25 font-medium',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/25 font-medium',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25 font-medium',
    zinc: 'bg-[#1A1D21] text-[#9CA3AF] border-[#2A2E35] font-medium',
    outline: 'border-[#2A2E35] text-[#9CA3AF] font-normal',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 rounded-md gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border select-none whitespace-nowrap leading-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
