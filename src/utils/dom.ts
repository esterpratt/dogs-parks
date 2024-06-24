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

export { isParentWithId };
