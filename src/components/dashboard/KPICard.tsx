import React, { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: 'UP' | 'DOWN' | 'NEUTRAL';
  trendValue?: string;
  icon?: ReactNode;
  tooltip?: string;
  highlight?: boolean;
  colorVariant?: 'emerald' | 'rose' | 'blue' | 'purple' | 'amber' | 'zinc';
  onClick?: () => void;
  badge?: ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subValue,
  trend,
  trendValue,
  icon,
  tooltip,
  highlight = false,
  colorVariant,
  onClick,
  badge,
}) => {
  const isClickable = Boolean(onClick);

  return (
    <Card 
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        'p-3.5 bg-[#15171A] border-[#22252A] transition-all relative group',
        isClickable && 'cursor-pointer hover:border-[#3B82F6]/50 hover:bg-[#1A1D22] hover:shadow-md',
        highlight && 'border-emerald-500/40 bg-[#15171A]',
        colorVariant === 'emerald' && 'hover:border-emerald-500/50',
        colorVariant === 'rose' && 'hover:border-rose-500/50',
        colorVariant === 'purple' && 'hover:border-purple-500/50',
        colorVariant === 'amber' && 'hover:border-amber-500/50',
        colorVariant === 'blue' && 'hover:border-blue-500/50'
      )}
    >
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#848B98] truncate" title={tooltip || title}>
          {title}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {badge}
          {icon && <div className="text-[#848B98]">{icon}</div>}
          {isClickable && (
            <ChevronRight className="h-3 w-3 text-[#606773] opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className={cn(
          "text-lg font-bold font-mono text-[#F3F4F6] tracking-tight truncate",
          colorVariant === 'emerald' && 'text-emerald-400',
          colorVariant === 'rose' && 'text-rose-400',
          colorVariant === 'blue' && 'text-blue-400',
          colorVariant === 'purple' && 'text-purple-400',
          colorVariant === 'amber' && 'text-amber-400'
        )}>
          {value}
        </div>
        {trendValue && (
          <span className={cn(
            'text-[10.5px] font-mono font-medium shrink-0',
            trend === 'UP' ? 'text-emerald-400' : trend === 'DOWN' ? 'text-rose-400' : 'text-[#848B98]'
          )}>
            {trendValue}
          </span>
        )}
      </div>

      {subValue && (
        <div className="text-[11px] text-[#848B98] mt-1 truncate">
          {subValue}
        </div>
      )}
    </Card>
  );
};

