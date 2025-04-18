import { ChangeEvent, ReactNode } from 'react';
import classnames from 'classnames';
import styles from './SearchList.module.scss';
import { Button } from './Button';
import { SearchListItems } from './SearchListItems';
import { Loader } from './Loader';
import { SearchInput, SearchInputProps } from './inputs/SearchInput';

interface SearchListAsyncProps<T> {
  filteredItems: T[];
  input: string;
  onChangeInput: (event: ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  showLoader: boolean;
  showNoResults: boolean;
  placeholder?: string;
  containerClassName?: string;
  noResultsLayout?: string | ReactNode;
  itemKeyfn: (item: T) => string;
  children: (item: T) => ReactNode;
  renderSearchInput?: ({
    value,
    onChangeInput,
    placeholder,
  }: SearchInputProps) => ReactNode;
}

const SearchListAsync = <T,>({
  filteredItems,
  input,
  onChangeInput,
  onSearch,
  showLoader,
  showNoResults,
  placeholder = 'Search',
  itemKeyfn,
  containerClassName,
  noResultsLayout = 'No Results',
  children,
  renderSearchInput,
}: SearchListAsyncProps<T>) => {
  return (
    <div className={classnames(styles.container, containerClassName)}>
      <div className={styles.inputContainer}>
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
        <Button
          disabled={!input.length}
          onClick={onSearch}
          className={styles.button}
        >
          Search
        </Button>
      </div>
      {showLoader && <Loader inside />}
      {!showLoader && !!filteredItems.length && (
        <SearchListItems items={filteredItems} itemKeyfn={itemKeyfn}>
          {children}
        </SearchListItems>
      )}
      {!showLoader && showNoResults && !filteredItems.length && (
        <span className={styles.noResults}>{noResultsLayout}</span>
      )}
    </div>
  );
};

export { SearchListAsync };
