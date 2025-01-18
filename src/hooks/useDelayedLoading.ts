import { useState, useEffect } from 'react';

interface UseDelayedLoadingParams {
  isLoading: boolean;
  minDuration?: number;
  threshold?: number;
}

export function useDelayedLoading({
  isLoading,
  minDuration = 1500,
  threshold = 100,
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
        // If loading was too fast, never show the loader
        setShowLoader(false);
      } else {
        // Otherwise, ensure loader stays for at least `minDuration`
        const remainingTime = minDuration - elapsedTime;
        const delay = Math.max(remainingTime, 0);

        const timer = setTimeout(() => setShowLoader(false), delay);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, minDuration, threshold, startTime]);

  return showLoader;
}
