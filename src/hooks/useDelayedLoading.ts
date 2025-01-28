import { useState, useEffect, useRef } from 'react';

interface UseDelayedLoadingParams {
  isLoading: boolean;
  minDuration?: number;
  threshold?: number;
}

export function useDelayedLoading({
  isLoading,
  minDuration = 1500,
  threshold = 50,
}: UseDelayedLoadingParams) {
  const [showLoader, setShowLoader] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setShowLoader(true);
    } else if (startTimeRef.current !== null) {
      const elapsedTime = Date.now() - startTimeRef.current;

      if (elapsedTime < threshold) {
        setShowLoader(false);
      } else {
        const remainingTime = minDuration - elapsedTime;
        const delay = Math.max(remainingTime, 0);

        const timer = setTimeout(() => setShowLoader(false), delay);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, minDuration, threshold]);

  return showLoader;
}
