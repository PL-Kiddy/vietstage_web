import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

interface UseAxiosRequestOptions<T> {
  auto?: boolean;
  initialData?: T;
}

interface UseAxiosRequestResult<T> {
  data: T | undefined;
  error: string;
  loading: boolean;
  execute: (signal?: AbortSignal) => Promise<T | undefined>;
  setData: Dispatch<SetStateAction<T | undefined>>;
}

// Hook gọi API qua apiRequest với state loading/error/data, hỗ trợ abort (chống race condition bằng requestId)
export const useAxiosRequest = <T>(
  request: (signal?: AbortSignal) => Promise<T>,
  options: UseAxiosRequestOptions<T> = {},
): UseAxiosRequestResult<T> => {
  const { auto = true, initialData } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(auto);
  const requestIdRef = useRef(0);
  const requestRef = useRef(request);

  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  // Thực thi request thủ công (bỏ qua nếu đã bị abort hoặc có request mới hơn)
  const execute = useCallback(async (signal?: AbortSignal) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');

    try {
      const result = await requestRef.current(signal);
      if (signal?.aborted || requestId !== requestIdRef.current) {
        return undefined;
      }
      setData(result);
      return result;
    } catch (reason) {
      if (signal?.aborted || requestId !== requestIdRef.current) {
        return undefined;
      }
      setError(reason instanceof Error ? reason.message : 'Khong the tai du lieu.');
      throw reason;
    } finally {
      if (!signal?.aborted && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Tự động gọi request khi mount (auto=true), hủy khi unmount
  useEffect(() => {
    if (!auto) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void execute(controller.signal).catch(() => undefined);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [auto, execute]);

  return { data, error, loading, execute, setData };
};
