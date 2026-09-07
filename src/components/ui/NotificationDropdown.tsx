/**
 * Notification Center Dropdown Panel
 */

import React, { useRef, useEffect } from 'react';
import { useNotification, NotificationItem } from '../../context/NotificationContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, Bell, Trash2, CheckCheck } from 'lucide-react';
import { Button } from './Button';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotification();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#2A2E35] bg-[#15171A] dark:bg-[#15171A] light:bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#F3F4F6] dark:text-[#F3F4F6] light:text-[#111827]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB] bg-[#0C0D0F]/50 dark:bg-[#0C0D0F]/50 light:bg-[#F9FAFB]">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-white dark:text-white light:text-[#111827]">System Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-1 rounded text-[#848B98] hover:text-emerald-400 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[10px]">Read all</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="p-1 rounded text-[#848B98] hover:text-rose-400 text-[11px] cursor-pointer transition-colors"
              title="Clear all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#22252A] dark:divide-[#22252A] light:divide-[#E5E7EB]">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-[#848B98] text-xs">
            No system notifications.
          </div>
        ) : (
          notifications.map((item) => (
            <NotificationRow key={item.id} item={item} onRead={() => markAsRead(item.id)} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB] bg-[#0C0D0F]/30 dark:bg-[#0C0D0F]/30 light:bg-[#F9FAFB] text-center">
        <span className="text-[10px] text-[#606773] font-mono">TradeOS Real-time Event Queue</span>
      </div>
    </div>
  );
};

const NotificationRow: React.FC<{ item: NotificationItem; onRead: () => void }> = ({ item, onRead }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={onRead}
      className={`p-3 flex items-start gap-2.5 transition-colors cursor-pointer hover:bg-[#1A1D21] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] ${
        !item.isRead ? 'bg-emerald-500/5' : ''
      }`}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={`text-xs font-semibold ${!item.isRead ? 'text-white dark:text-white light:text-[#111827]' : 'text-[#848B98]'}`}>
            {item.title}
          </p>
          <span className="text-[10px] text-[#606773] font-mono shrink-0">{formatTime(item.timestamp)}</span>
        </div>
        {item.message && (
          <p className="text-[11px] text-[#848B98] mt-0.5 line-clamp-2 leading-relaxed">
            {item.message}
          </p>
        )}
      </div>
      {!item.isRead && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1" />
      )}
    </div>
  );
};
