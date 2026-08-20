import { useState, useEffect, useCallback, useRef } from 'react';

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
// Hook quản lý trạng thái loading screen: bắt đầu/dừng với thời gian tối thiểu hiển thị (chống nhấp nháy)
const useLoading = (options: UseLoadingOptions = {}): UseLoadingReturn => {
  const { minDuration = 2000, autoStart = false } = options;
  const [isLoading, setIsLoading] = useState(autoStart);
  const loadingStartTime = useRef<number | null>(null);

  // Bắt đầu hiển thị loading, ghi nhận thời điểm bắt đầu
  const startLoading = useCallback(() => {
    setIsLoading(true);
    loadingStartTime.current = Date.now();
  }, []);

  // Dừng loading, đảm bảo hiển thị ít nhất minDuration kể từ khi bắt đầu
  const stopLoading = useCallback(() => {
    if (loadingStartTime.current === null) {
      setIsLoading(false);
      return;
    }

    const elapsed = Date.now() - loadingStartTime.current;
    const remaining = Math.max(0, minDuration - elapsed);

    if (remaining > 0) {
      setTimeout(() => {
        setIsLoading(false);
        loadingStartTime.current = null;
      }, remaining);
    } else {
      setIsLoading(false);
      loadingStartTime.current = null;
    }
  }, [minDuration]);

  // Tự dừng sau minDuration nếu dùng autoStart (không cần gọi stopLoading thủ công)
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
