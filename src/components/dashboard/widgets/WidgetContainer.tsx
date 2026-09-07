import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { 
  ChevronUp, 
  ChevronDown, 
  Maximize2, 
  Minimize2, 
  Settings, 
  EyeOff, 
  GripVertical,
  Columns,
  Sparkles
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { CustomWidgetConfig, DashboardWidgetSetting } from '../../../types/customization';
import { useCustomization } from '../../../context/CustomizationContext';

interface WidgetContainerProps {
  widget: CustomWidgetConfig;
  children: React.ReactNode;
  defaultTitle?: string;
  badge?: React.ReactNode;
  actionContent?: React.ReactNode;
  onOpenSettings?: () => void;
  className?: string;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  widget,
  children,
  defaultTitle,
  badge,
  actionContent,
  onOpenSettings,
  className,
}) => {
  const { 
    moveWidget, 
    toggleWidget, 
    updateWidgetColSpan, 
    updateWidgetHeight 
  } = useCustomization();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const title = widget.customSettings?.customTitle || widget.title || defaultTitle || 'Widget';
  const colSpan = widget.colSpan || 1;
  const height = widget.height || 'standard';

  // Map colSpan to Tailwind grid column span classes
  const colSpanClass = 
    colSpan === 3 || colSpan === 4
      ? 'col-span-1 lg:col-span-3'
      : colSpan === 2
      ? 'col-span-1 lg:col-span-2'
      : 'col-span-1';

  // Map height class
  const heightClass = 
    height === 'compact'
      ? 'min-h-[220px]'
      : height === 'expanded'
      ? 'min-h-[420px]'
      : 'min-h-[300px]';

  const cycleColSpan = () => {
    const nextCol = colSpan === 1 ? 2 : colSpan === 2 ? 3 : 1;
    updateWidgetColSpan(widget.id, nextCol as 1 | 2 | 3);
  };

  const cycleHeight = () => {
    const nextHeight = height === 'compact' ? 'standard' : height === 'standard' ? 'expanded' : 'compact';
    updateWidgetHeight(widget.id, nextHeight);
  };

  return (
    <Card
      className={cn(
        'bg-[#15171A] border-[#22252A] transition-all flex flex-col',
        colSpanClass,
        heightClass,
        className
      )}
    >
      {/* Widget Header Toolbar */}
      <CardHeader className="py-2.5 px-4 border-b border-[#22252A] flex flex-row items-center justify-between gap-2 select-none bg-[#111316]">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-[#555C68] hover:text-[#848B98] cursor-grab active:cursor-grabbing shrink-0" />
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-white truncate flex items-center gap-2">
            <span>{title}</span>
            {badge}
          </CardTitle>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {actionContent}

          {/* Quick Col Span Resizer */}
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleColSpan}
            title={`Column Width: ${colSpan} of 3 (Click to resize)`}
            className="h-6 px-1.5 text-[#848B98] hover:text-white hover:bg-[#22252A] text-[10px] gap-1 font-mono"
          >
            <Columns className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">{colSpan}x</span>
          </Button>

          {/* Quick Height Resizer */}
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleHeight}
            title={`Height: ${height} (Click to toggle)`}
            className="h-6 px-1.5 text-[#848B98] hover:text-white hover:bg-[#22252A] text-[10px] gap-1 capitalize font-mono"
          >
            {height === 'expanded' ? (
              <Minimize2 className="w-3 h-3 text-blue-400" />
            ) : (
              <Maximize2 className="w-3 h-3 text-blue-400" />
            )}
            <span className="hidden sm:inline">{height.slice(0, 3)}</span>
          </Button>

          {/* Move Up */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => moveWidget(widget.id, 'UP')}
            title="Move Widget Up"
            className="h-6 w-6 p-0 text-[#848B98] hover:text-white hover:bg-[#22252A]"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </Button>

          {/* Move Down */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => moveWidget(widget.id, 'DOWN')}
            title="Move Widget Down"
            className="h-6 w-6 p-0 text-[#848B98] hover:text-white hover:bg-[#22252A]"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>

          {/* Custom Settings Modal Trigger */}
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSettings}
              title="Configure Widget"
              className="h-6 w-6 p-0 text-[#848B98] hover:text-white hover:bg-[#22252A]"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Hide / Remove Widget */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleWidget(widget.id)}
            title="Hide Widget"
            className="h-6 w-6 p-0 text-[#848B98] hover:text-rose-400 hover:bg-rose-500/10"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>

      {/* Widget Content Body */}
      <CardContent className="p-4 flex-1 flex flex-col min-h-0 overflow-auto">
        {children}
      </CardContent>
    </Card>
  );
};
