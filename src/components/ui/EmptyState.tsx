/**
 * Reusable Empty State Component
 */

import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
  children?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon: ActionIcon,
  secondaryActionText,
  onSecondaryAction,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB] bg-[#15171A]/40 dark:bg-[#15171A]/40 light:bg-white',
        className
      )}
    >
      <div className="h-12 w-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/20 flex items-center justify-center text-emerald-400 dark:text-emerald-400 light:text-emerald-600 mb-4">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="text-sm sm:text-base font-semibold text-[#F3F4F6] dark:text-[#F3F4F6] light:text-[#111827] mb-1.5">
        {title}
      </h3>

      <p className="text-xs text-[#848B98] dark:text-[#848B98] light:text-[#6B7280] max-w-md leading-relaxed mb-5">
        {description}
      </p>

      {children}

      {(actionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionText && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
              <span>{actionText}</span>
            </Button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              <span>{secondaryActionText}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
