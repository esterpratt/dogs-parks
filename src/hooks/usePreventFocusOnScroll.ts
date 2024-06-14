import { useEffect, useRef } from 'react';

const usePreventFocusOnScroll = () => {
  const isMoved = useRef(false);

  useEffect(() => {
    const flagStart = () => {
      isMoved.current = false;
    };

    const removeFocus = () => {
      if (!isMoved.current) {
        isMoved.current = true;
        const focusedElement = document.activeElement as HTMLElement;

        if (focusedElement && focusedElement !== document.body) {
          focusedElement.blur();
        }
      }
    };

    document.addEventListener('touchmove', removeFocus, { passive: true });
    document.addEventListener('touchstart', flagStart);

    return () => {
      document.removeEventListener('touchmove', removeFocus);
      document.removeEventListener('touchstart', flagStart);
    };
  }, []);
};

export { usePreventFocusOnScroll };
