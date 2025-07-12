import { ChangeEvent, ReactNode } from 'react';
import classnames from 'classnames';
import { Button } from '../Button';
import { Loader } from '../Loader';
import { SearchInput, SearchInputProps } from '../inputs/SearchInput';
import { SearchListItems } from './SearchListItems';
import styles from './SearchList.module.scss';

interface SearchListAsyncProps<T> {
  filteredItems: T[];
  input: string;
  onChangeInput: (event: ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  showLoader: boolean;
  showNoResults: boolean;
  placeholder?: string;
  containerClassName?: string;
  inputContainerClassName?: string;
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
  inputContainerClassName,
  noResultsLayout = 'No Results',
  children,
  renderSearchInput,
}: SearchListAsyncProps<T>) => {
  return (
    <div className={classnames(styles.container, containerClassName)}>
      <div
        className={classnames(styles.inputContainer, inputContainerClassName)}
      >
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
          disabled={!input.trim().length}
          onClick={onSearch}
          className={styles.button}
        >
          Search
        </Button>
      </div>
      {showLoader && <Loader />}
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
