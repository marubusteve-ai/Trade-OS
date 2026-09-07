/**
 * Toast Container Component
 * Floating notification alerts rendered at top-right or bottom-right
 */

import React from 'react';
import { useNotification, ToastItem } from '../../context/NotificationContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/30 bg-[#15171A] dark:bg-[#15171A] light:bg-white text-emerald-300';
      case 'error':
        return 'border-rose-500/30 bg-[#15171A] dark:bg-[#15171A] light:bg-white text-rose-300';
      case 'warning':
        return 'border-amber-500/30 bg-[#15171A] dark:bg-[#15171A] light:bg-white text-amber-300';
      case 'info':
      default:
        return 'border-blue-500/30 bg-[#15171A] dark:bg-[#15171A] light:bg-white text-blue-300';
    }
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in',
        getBorderColor()
      )}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-white dark:text-[#F3F4F6] light:text-[#111827] leading-tight">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-[11px] text-[#848B98] dark:text-[#848B98] light:text-[#4B5563] mt-0.5 leading-normal">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-[#848B98] hover:text-white dark:hover:text-white light:hover:text-[#111827] p-0.5 rounded transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
