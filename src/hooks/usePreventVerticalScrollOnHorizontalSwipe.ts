import { useEffect } from 'react';

const usePreventVerticalScrollOnHorizontalSwipe = (
  containerRef: React.RefObject<HTMLElement>,
  threshold = 5
) => {
  useEffect(() => {
    if (!containerRef.current) return;

    let firstClientX = 0;

    const handleTouchStart = (e: Event) => {
      if (!(e instanceof TouchEvent)) return;
      firstClientX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: Event) => {
      if (!(e instanceof TouchEvent)) return;

      const clientX = e.touches[0].clientX - firstClientX;

      if (Math.abs(clientX) > threshold) {
        e.preventDefault();
      }
    };

    const el = containerRef.current;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [containerRef, threshold]);
};

export { usePreventVerticalScrollOnHorizontalSwipe}