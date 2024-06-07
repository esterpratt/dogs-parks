import { useEffect } from 'react';

const FOCUSED_ELEMENTS = ['INPUT', 'TEXTAREA'];

const usePreventScrollOnFocus = () => {
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    const onFocus = (event: FocusEvent) => {
      if (FOCUSED_ELEMENTS.includes((event.target as HTMLElement).tagName)) {
        document.body.style.position = 'fixed';
        document.body.style.overflow = 'hidden';
        document.addEventListener('touchmove', preventScroll, {
          passive: false,
        });
      }
    };

    const onBlur = () => {
      document.body.style.position = 'unset';
      document.body.style.overflow = 'unset';
      document.removeEventListener('touchmove', preventScroll);
    };

    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);

    return () => {
      document.removeEventListener('focus', onFocus);
      document.removeEventListener('blur', onBlur);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);
};

export { usePreventScrollOnFocus };
