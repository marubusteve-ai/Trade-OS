import React, { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixElement?: ReactNode;
  suffixElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, prefixElement, suffixElement, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-[#D1D5DB]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixElement && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[#9CA3AF] text-xs font-mono">
              {prefixElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex h-9 w-full rounded-lg border border-[#2A2E35] bg-[#0C0D0F] px-3 py-1.5 text-sm text-[#F3F4F6] placeholder:text-[#606773] transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 font-mono-numbers',
              prefixElement && 'pl-8',
              suffixElement && 'pr-10',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
              className
            )}
            {...props}
          />
          {suffixElement && (
            <div className="absolute right-3 flex items-center pointer-events-none text-[#9CA3AF] text-xs">
              {suffixElement}
            </div>
          )}
        </div>
        {error && <p className="text-[11px] text-rose-400">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-[#606773]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, error, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-[#D1D5DB]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'flex h-9 w-full rounded-lg border border-[#2A2E35] bg-[#0C0D0F] px-3 py-1.5 text-sm text-[#F3F4F6] transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-[11px] text-rose-400">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-[#606773]">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
