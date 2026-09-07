/**
 * Global Notification & Toast Alert Framework
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  category?: string;
  timestamp: string;
  isRead: boolean;
}

export interface ToastItem extends NotificationItem {
  duration?: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  toasts: ToastItem[];
  unreadCount: number;
  notify: {
    success: (title: string, message?: string, duration?: number, category?: string) => void;
    error: (title: string, message?: string, duration?: number, category?: string) => void;
    warning: (title: string, message?: string, duration?: number, category?: string) => void;
    info: (title: string, message?: string, duration?: number, category?: string) => void;
  };
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissToast: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_welcome',
      type: 'info',
      title: 'Welcome to TradeOS Automation Framework',
      message: 'Autonomous WHEN-condition-IS-TRUE-THEN-action engine and risk guardrails are active.',
      category: 'RISK',
      timestamp: new Date().toISOString(),
      isRead: false,
    },
  ]);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string,
    duration = 4500,
    category = 'SYSTEM'
  ) => {
    const id = 'notif_' + Math.random().toString(36).substring(2, 9);
    const item: ToastItem = {
      id,
      type,
      title,
      message,
      category,
      timestamp: new Date().toISOString(),
      isRead: false,
      duration,
    };

    setNotifications((prev) => [item, ...prev].slice(0, 50));
    setToasts((prev) => [...prev, item]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const notify = {
    success: (title: string, message?: string, duration?: number, category?: string) =>
      addNotification('success', title, message, duration, category),
    error: (title: string, message?: string, duration?: number, category?: string) =>
      addNotification('error', title, message, duration || 5000, category),
    warning: (title: string, message?: string, duration?: number, category?: string) =>
      addNotification('warning', title, message, duration, category),
    info: (title: string, message?: string, duration?: number, category?: string) =>
      addNotification('info', title, message, duration, category),
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        toasts,
        unreadCount,
        notify,
        markAsRead,
        markAllAsRead,
        dismissToast,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
