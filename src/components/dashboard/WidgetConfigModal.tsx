import React from 'react';
import { DashboardWidgetConfig } from '../../types/calculations';
import { 
  X, 
  MoveUp, 
  MoveDown, 
  RotateCcw, 
  Check, 
  Sliders, 
  LayoutGrid, 
  Eye, 
  EyeOff,
  GripVertical
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidgetConfig[];
  onSaveWidgets: (updated: DashboardWidgetConfig[]) => void;
  onResetDefaults: () => void;
}

export const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onSaveWidgets,
  onResetDefaults,
}) => {
  const [currentWidgets, setCurrentWidgets] = React.useState<DashboardWidgetConfig[]>(() => 
    [...widgets].sort((a, b) => a.order - b.order)
  );

  React.useEffect(() => {
    setCurrentWidgets([...widgets].sort((a, b) => a.order - b.order));
  }, [widgets]);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    setCurrentWidgets(prev => 
      prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w)
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setCurrentWidgets(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy.map((w, idx) => ({ ...w, order: idx + 1 }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === currentWidgets.length - 1) return;
    setCurrentWidgets(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy.map((w, idx) => ({ ...w, order: idx + 1 }));
    });
  };

  const handleSave = () => {
    onSaveWidgets(currentWidgets);
    onClose();
  };

  const handleReset = () => {
    onResetDefaults();
    onClose();
  };

  const enabledCount = currentWidgets.filter(w => w.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#121417] border border-[#22252A] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#22252A] bg-[#15171A]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Customize Dashboard Layout
              </h2>
              <p className="text-xs text-[#848B98]">
                {enabledCount} of {currentWidgets.length} widgets active • Drag / Reorder view
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#848B98] hover:text-white hover:bg-[#22252A] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Widgets List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {currentWidgets.map((widget, idx) => (
            <div
              key={widget.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                widget.enabled 
                  ? 'bg-[#15171A] border-[#22252A]' 
                  : 'bg-[#0C0D0F]/60 border-[#1B1D22] opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-[#606773] shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {widget.title}
                    </span>
                    <Badge variant={widget.enabled ? 'emerald' : 'zinc'} size="sm">
                      {widget.enabled ? 'ACTIVE' : 'HIDDEN'}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-[#848B98] font-mono">
                    Type: {widget.type}
                  </span>
                </div>
              </div>

              {/* Actions: Reorder & Toggle */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={idx === 0}
                  onClick={() => handleMoveUp(idx)}
                  className="h-7 w-7 p-0 text-[#848B98] hover:text-white"
                  title="Move Up"
                >
                  <MoveUp className="h-3.5 w-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={idx === currentWidgets.length - 1}
                  onClick={() => handleMoveDown(idx)}
                  className="h-7 w-7 p-0 text-[#848B98] hover:text-white"
                  title="Move Down"
                >
                  <MoveDown className="h-3.5 w-3.5" />
                </Button>

                <Button
                  variant={widget.enabled ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => handleToggle(widget.id)}
                  className="h-7 text-xs px-2 ml-1"
                >
                  {widget.enabled ? (
                    <>
                      <Eye className="h-3 w-3 mr-1 text-emerald-400" />
                      Show
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 mr-1 text-[#848B98]" />
                      Hide
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#22252A] bg-[#15171A] flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-[#848B98] hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset Defaults
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Layout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
