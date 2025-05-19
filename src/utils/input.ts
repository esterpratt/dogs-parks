const preserveCursor = (
  inputRef: React.RefObject<HTMLInputElement>,
  fn: () => void
) => {
  const cursorPos = inputRef.current?.selectionStart ?? null;
  fn();
  requestAnimationFrame(() => {
    if (!inputRef.current || cursorPos === null) return;
    inputRef.current.focus();
    inputRef.current.setSelectionRange(cursorPos, cursorPos);
  });
};

export { preserveCursor }