import { useState, useEffect, useCallback } from 'react';

interface UseLoadingOptions {
  /** Minimum display time in ms (prevents flash) */
  minDuration?: number;
  /** Auto-start loading on mount */
  autoStart?: boolean;
}

interface UseLoadingReturn {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

/**
 * Custom hook to manage loading screen state.
 *
 * Usage:
 * - Route transitions: `useLoading({ minDuration: 2000, autoStart: true })`
 * - API calls: `const { startLoading, stopLoading } = useLoading()`
 */
const useLoading = (options: UseLoadingOptions = {}): UseLoadingReturn => {
  const { minDuration = 2000, autoStart = false } = options;
  const [isLoading, setIsLoading] = useState(autoStart);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(
    autoStart ? Date.now() : null
  );

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setLoadingStartTime(Date.now());
  }, []);

  const stopLoading = useCallback(() => {
    if (loadingStartTime === null) {
      setIsLoading(false);
      return;
    }

    const elapsed = Date.now() - loadingStartTime;
    const remaining = Math.max(0, minDuration - elapsed);

    if (remaining > 0) {
      setTimeout(() => {
        setIsLoading(false);
        setLoadingStartTime(null);
      }, remaining);
    } else {
      setIsLoading(false);
      setLoadingStartTime(null);
    }
  }, [loadingStartTime, minDuration]);

  // Auto-stop after minDuration if autoStart is used
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, minDuration);
      return () => clearTimeout(timer);
    }
  }, [autoStart, minDuration]);

  return { isLoading, startLoading, stopLoading };
};

export default useLoading;
