import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api';

/**
 * Runs an async request and tracks its state.
 * Re-runs whenever `deps` change; stale responses from earlier runs are ignored.
 *
 *   const { data, loading, error, refetch } = useFetch(() => serviceService.getAll(params), [params]);
 */
const useFetch = (request, deps = [], { immediate = true } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const latestCall = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const execute = useCallback(async () => {
    const callId = ++latestCall.current;
    setLoading(true);
    setError(null);
    try {
      const body = await request();
      if (callId === latestCall.current) setData(body);
      return body;
    } catch (err) {
      if (callId === latestCall.current) setError(getErrorMessage(err));
      return null;
    } finally {
      if (callId === latestCall.current) setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (immediate) execute();
  }, [execute, immediate]);

  return { data, loading, error, refetch: execute, setData };
};

export default useFetch;
