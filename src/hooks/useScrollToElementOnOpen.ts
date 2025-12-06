import { useEffect, RefObject } from 'react';

export function useScrollToElementOnOpen(
  isOpen: boolean,
  elementScrollOnOpen: RefObject<HTMLElement>
) {
  useEffect(() => {
    if (!isOpen) return;

    requestAnimationFrame(() => {
      const shouldScroll =
        sessionStorage.getItem('scroll-to-element') === 'true';

      if (shouldScroll) {
        elementScrollOnOpen?.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

        sessionStorage.removeItem('scroll-to-element');
      } else {
        let scrollableParent = elementScrollOnOpen?.current?.parentElement;

        // Traverse up to find a scrollable container
        while (scrollableParent) {
          const overflowY = window.getComputedStyle(scrollableParent).overflowY;
          if (
            overflowY === 'auto' ||
            overflowY === 'scroll' ||
            scrollableParent.scrollHeight > scrollableParent.clientHeight
          ) {
            break;
          }
          scrollableParent = scrollableParent.parentElement;
        }

        if (scrollableParent) {
          scrollableParent.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
        }
      }
    });
  }, [isOpen, elementScrollOnOpen]);
}
