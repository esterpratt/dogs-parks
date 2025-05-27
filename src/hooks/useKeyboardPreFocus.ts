import { useEffect } from "react";

const useKeyboardPreFocus = () => {
  useEffect(() => {
    const input = document.createElement('input');
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);

    input.focus();
    setTimeout(() => {
      input.blur();
      input.remove();
    }, 0);
  }, []);
}

export { useKeyboardPreFocus}