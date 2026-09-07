import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, children, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-[#848B98] dark:text-[#848B98] light:text-[#4B5563]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={inputId}
            ref={ref}
            className={cn(
              'w-full appearance-none rounded-lg bg-[#1A1D21] dark:bg-[#1A1D21] light:bg-[#F9FAFB] border border-[#2A2E35] dark:border-[#2A2E35] light:border-[#D1D5DB] px-3 py-2 pr-9 text-xs text-[#F3F4F6] dark:text-[#F3F4F6] light:text-[#111827] font-medium transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#848B98]">
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
        {error && <p className="text-[11px] text-rose-400">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-[#848B98] dark:text-[#848B98] light:text-[#6B7280]">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
