import { ChangeEvent, ReactNode, useState } from 'react';
import classnames from 'classnames';
import { useDebounce } from '../hooks/useDebounce';
import styles from './SearchList.module.scss';
import { Button } from './Button';
import { SearchListItems } from './SearchListItems';
import { Loader } from './Loader';

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
  const [showLoader, setShowLoader] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);

  const searchInput = isSearchToSee ? blurredInput : debouncedInput;

  const filteredItems: T[] = items.filter((item) =>
    filterFunc(item, searchInput)
  );

  const onChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
    setShowNoResults(false);
  };

  const onClickSearch = () => {
    setShowLoader(true);
    setShowNoResults(true);
    setTimeout(() => {
      setBlurredInput(input);
      setShowLoader(false);
    }, 1000);
  };

  return (
    <div className={classnames(styles.container, containerClassName)}>
      <input
        value={input}
        onChange={onChangeInput}
        placeholder={placeholder}
        className={styles.input}
      />
      {isSearchToSee && (
        <Button
          disabled={!input.length}
          variant="green"
          onClick={onClickSearch}
          className={styles.button}
        >
          Search
        </Button>
      )}
      {showLoader && <Loader inside />}
      {!showLoader && !!filteredItems.length && (
        <SearchListItems items={filteredItems} itemKeyfn={itemKeyfn}>
          {children}
        </SearchListItems>
      )}
      {!showLoader &&
        (!isSearchToSee || (isSearchToSee && showNoResults)) &&
        !filteredItems.length && (
          <span className={styles.noResults}>{noResultsLayout}</span>
        )}
    </div>
  );
};

export { SearchList };
