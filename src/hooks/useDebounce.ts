import { useEffect, useRef, useState } from 'react';

const useDebounce = (input: string, delay: number = 500) => {
  const [searchInput, setSearchInput] = useState<string>(input);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      console.log('input is: ', input);
      setSearchInput(input);
    }, delay);

    return () => {
      clearTimeout(timer.current);
    };
  }, [input, delay]);

  return { searchInput };
};

export { useDebounce };
