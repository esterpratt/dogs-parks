import { useState, useEffect } from 'react';

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
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      setStartTime(Date.now());
      setShowLoader(true);
    } else if (startTime !== null) {
      const elapsedTime = Date.now() - startTime;

      if (elapsedTime < threshold) {
        setShowLoader(false);
      } else {
        const remainingTime = minDuration - elapsedTime;
        const delay = Math.max(remainingTime, 0);

        const timer = setTimeout(() => setShowLoader(false), delay);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, minDuration, threshold, startTime]);

  return showLoader;
}
