import { ChangeEvent, ReactNode, useState } from 'react';
import classnames from 'classnames';
import { useDebounce } from '../hooks/useDebounce';
import { SearchListItems } from './SearchListItems';
import styles from './SearchList.module.scss';
import { SearchInput, SearchInputProps } from './inputs/SearchInput';

interface SearchListProps<T> {
  items: T[];
  placeholder?: string;
  containerClassName?: string;
  noResultsLayout?: string | ReactNode;
  itemKeyfn: (item: T) => string;
  filterFunc: (item: T, searchInput: string) => boolean;
  renderSearchInput?: ({
    value,
    onChangeInput,
    placeholder,
  }: SearchInputProps) => ReactNode;
  children: (item: T) => ReactNode;
}

const SearchList = <T,>({
  items,
  placeholder = 'Search',
  filterFunc,
  itemKeyfn,
  containerClassName,
  noResultsLayout = 'No Results',
  renderSearchInput,
  children,
}: SearchListProps<T>) => {
  const [input, setInput] = useState<string>('');
  const { searchInput } = useDebounce(input);

  const filteredItems: T[] = items.filter((item) =>
    filterFunc(item, searchInput)
  );

  const onChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  return (
    <div className={classnames(styles.container, containerClassName)}>
      {renderSearchInput ? (
        renderSearchInput({
          value: input,
          onChangeInput,
          placeholder,
        })
      ) : (
        <SearchInput
          value={input}
          onChangeInput={onChangeInput}
          placeholder={placeholder}
        />
      )}
      {!!filteredItems.length && (
        <SearchListItems items={filteredItems} itemKeyfn={itemKeyfn}>
          {children}
        </SearchListItems>
      )}
      {!filteredItems.length && !!noResultsLayout && (
        <span className={styles.noResults}>{noResultsLayout}</span>
      )}
    </div>
  );
};

export { SearchList };
