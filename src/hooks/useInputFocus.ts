import { useEffect } from 'react';

const FOCUSED_ELEMENTS = ['INPUT', 'TEXTAREA'];

interface UseInputFocusProps {
  onFocusCB: () => void;
  onBlurCB: () => void;
}

const useInputFocus = (
  onFocusCB: UseInputFocusProps['onFocusCB'],
  onBlurCB: UseInputFocusProps['onBlurCB']
) => {
  useEffect(() => {
    const onFocus = (event: FocusEvent) => {
      if (FOCUSED_ELEMENTS.includes((event.target as HTMLElement).tagName)) {
        onFocusCB();
      }
    };

    const onBlur = () => {
      onBlurCB();
    };

    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);

    return () => {
      document.removeEventListener('focus', onFocus);
      document.removeEventListener('blur', onBlur);
    };
  }, [onBlurCB, onFocusCB]);
};

export { useInputFocus };
