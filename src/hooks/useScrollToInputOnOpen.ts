import { useEffect, RefObject } from 'react';

export function useScrollToInputOnOpen(
  isOpen: boolean,
  inputRef: RefObject<HTMLElement>,
  formRef: RefObject<HTMLElement>
) {
  useEffect(() => {
    if (!isOpen) return;

    requestAnimationFrame(() => {
      const shouldScroll = sessionStorage.getItem('scroll-to-input') === 'true';

      const targetRef = shouldScroll ? inputRef : formRef;
      targetRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      if (shouldScroll) {
        sessionStorage.removeItem('scroll-to-input');
      }
    });
  }, [isOpen, inputRef, formRef]);
}
