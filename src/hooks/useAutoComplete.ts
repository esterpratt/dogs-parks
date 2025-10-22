import { ChangeEvent, useMemo, useState } from 'react';
import { useDebounce } from './useDebounce';

interface UseAutoCompleteParams<T> {
  items: T[];
  filterFunc: (item: T, searchInput: string) => boolean;
}

const useAutoComplete = <T>(params: UseAutoCompleteParams<T>) => {
  const { items, filterFunc } = params;
  const [input, setInput] = useState<string>('');
  const { searchInput } = useDebounce(input);

  const onChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => filterFunc(item, searchInput));
  }, [items, searchInput, filterFunc]);

  return {
    onChangeInput,
    filteredItems,
    input,
    setInput,
  };
};

export { useAutoComplete };
