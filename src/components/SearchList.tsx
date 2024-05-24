import { ChangeEvent, ReactNode, useState } from 'react';
import classnames from 'classnames';
import { useDebounce } from '../hooks/useDebounce';
import styles from './SearchList.module.scss';
import { Button } from './Button';

interface SearchListProps<T> {
  items: T[];
  placeholder?: string;
  containerClassName?: string;
  noResultsLayout?: string | ReactNode;
  itemKeyfn: (item: T) => string;
  filterFunc: (item: T, searchInput: string) => boolean;
  children: (item: T) => ReactNode;
  isSearchToSee?: boolean;
}

const SearchList = <T,>({
  items,
  placeholder = 'Search',
  filterFunc,
  itemKeyfn,
  containerClassName,
  noResultsLayout = 'No Results',
  isSearchToSee = false,
  children,
}: SearchListProps<T>) => {
  const [input, setInput] = useState<string>('');
  const { searchInput: debouncedInput } = useDebounce(input);
  const [blurredInput, setBlurredInput] = useState('');

  const searchInput = isSearchToSee ? blurredInput : debouncedInput;

  const filteredItems: T[] = items.filter((item) =>
    filterFunc(item, searchInput)
  );

  const onChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const onBlur = () => {
    setBlurredInput(input);
  };

  return (
    <div className={classnames(styles.container, containerClassName)}>
      <input
        value={input}
        onChange={onChangeInput}
        onBlur={onBlur}
        placeholder={placeholder}
        className={styles.input}
      />
      {isSearchToSee && (
        <Button variant="green" onClick={onBlur} className={styles.button}>
          Search
        </Button>
      )}
      {!!filteredItems.length && (
        <ul className={styles.list}>
          {filteredItems.map((item) => (
            <li key={itemKeyfn(item)} className={styles.item}>
              {children(item)}
            </li>
          ))}
        </ul>
      )}
      {(!isSearchToSee || (isSearchToSee && searchInput)) &&
        !filteredItems.length && (
          <span className={styles.noResults}>{noResultsLayout}</span>
        )}
    </div>
  );
};

export { SearchList };
