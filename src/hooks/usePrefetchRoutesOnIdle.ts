import { useEffect } from 'react';
import { routePreloadMap } from '../utils/routePreloadMap';

const safeRequestIdleCallback = (cb: () => void) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(cb);
  } else {
    setTimeout(cb, 2000);
  }
};

export const usePrefetchRoutesOnIdle = (routeKeys: string[]) => {
  useEffect(() => {
    safeRequestIdleCallback(() => {
      routeKeys.forEach((key) => {
        const preload = routePreloadMap[key];
        if (preload) preload();
      });
    });
  }, [routeKeys]);
};
