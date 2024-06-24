import { RefObject } from 'react';

const isParentWithId = (target: HTMLElement | null, id: string) => {
  let elementTarget = target;
  while (elementTarget) {
    if (elementTarget.id === id) {
      return true;
    }
    elementTarget = elementTarget.parentElement;
  }
  return false;
};

const scrollRefToTop = (ref: RefObject<HTMLElement>) => {
  if (!ref.current) {
    return;
  }

  ref.current.scrollIntoView({
    block: 'start',
    behavior: 'smooth',
  });
};

export { isParentWithId, scrollRefToTop };
