import { useEffect } from 'react';

interface UseClickOutsideProps {
  refs: React.RefObject<HTMLElement>[];
  handler: (event: MouseEvent | TouchEvent) => void;
}

export function useClickOutside({refs, handler}: UseClickOutsideProps) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const isInsideSomeRef = refs.some(ref => {
        const el = ref.current;
        return el && el.contains(event.target as Node);
      });

      if (isInsideSomeRef) return;

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [refs, handler]);
}
