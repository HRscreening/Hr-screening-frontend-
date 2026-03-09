import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  interval?: number;
  enabled?: boolean;
  shouldStop?: (data: T) => boolean;
  onData?: (data: T) => void;
  onError?: (error: unknown) => void;
}

export function usePolling<T>({
  fetcher,
  interval = 3000,
  enabled = true,
  shouldStop,
  onData,
  onError,
}: UsePollingOptions<T>) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);
  const fetcherRef = useRef(fetcher);
  const onDataRef = useRef(onData);
  const onErrorRef = useRef(onError);
  const shouldStopRef = useRef(shouldStop);

  // Keep refs up to date without triggering re-renders
  fetcherRef.current = fetcher;
  onDataRef.current = onData;
  onErrorRef.current = onError;
  shouldStopRef.current = shouldStop;

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    stoppedRef.current = false;

    const poll = async () => {
      try {
        const data = await fetcherRef.current();
        if (stoppedRef.current) return;
        onDataRef.current?.(data);
        if (shouldStopRef.current?.(data)) {
          stoppedRef.current = true;
          cleanup();
        }
      } catch (err) {
        if (!stoppedRef.current) {
          onErrorRef.current?.(err);
        }
      }
    };

    // Immediate first poll
    poll();

    timerRef.current = setInterval(poll, interval);

    return () => {
      stoppedRef.current = true;
      cleanup();
    };
  }, [enabled, interval, cleanup]);

  return { stop: cleanup };
}
