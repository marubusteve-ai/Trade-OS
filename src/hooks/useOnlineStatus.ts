import { useState, useEffect, useCallback } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const effectiveType = typeof navigator !== 'undefined' ? (navigator as any)?.connection?.effectiveType || '4G' : '4G';
  const connectionType = typeof navigator !== 'undefined' ? (navigator as any)?.connection?.type || 'wifi' : 'wifi';

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return false;
    }

    try {
      const startTime = performance.now();
      // Fast heartbeat ping against favicon or root
      const response = await fetch('/favicon.ico?_t=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
      });
      const duration = Math.round(performance.now() - startTime);
      setLatencyMs(duration);
      setIsOnline(response.ok || response.status === 304 || response.status === 200 || response.type === 'opaque');
      return true;
    } catch {
      // In dev or offline environments where fetch fails
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsReconnecting(true);
      await checkConnection();
      setIsReconnecting(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnecting(false);
      setLatencyMs(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();

    // Periodic heartbeat check every 45 seconds
    const interval = setInterval(checkConnection, 45000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection]);

  return {
    isOnline,
    isReconnecting,
    latencyMs,
    effectiveType,
    connectionType,
    checkConnection,
  };
}
