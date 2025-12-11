import { MouseEvent, ReactNode, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { Input } from './Input';
import { SearchListItems } from '../searchList/SearchListItems';
import styles from './AutoComplete.module.scss';
import { useAutoComplete } from '../../hooks/useAutoComplete';

interface AutoCompleteProps<T> {
  selectedInput?: string;
  items: T[];
  placeholder?: string;
  className?: string;
  label: string;
  itemKeyfn: (item: T) => string;
  setSelectedInput: (item: T) => void;
  equalityFunc: (item: T, selectedInput?: string) => boolean;
  filterFunc: (item: T, searchInput: string) => boolean;
  children: (item: T, isChosen: boolean) => ReactNode;
  selectedInputFormatter?: (selectedInput: string) => string;
}

const AutoComplete = <T,>({
  items,
  selectedInput,
  placeholder,
  className,
  itemKeyfn,
  label,
  filterFunc,
  setSelectedInput,
  equalityFunc,
  children,
  selectedInputFormatter,
}: AutoCompleteProps<T>) => {
  const { input, setInput, filteredItems, onChangeInput } = useAutoComplete({
    items,
    filterFunc,
  });

  const [showItems, setShowItems] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const displayValue = selectedInput || '';
    setInput(
      selectedInputFormatter && displayValue
        ? selectedInputFormatter(displayValue)
        : displayValue
    );
  }, [selectedInput, selectedInputFormatter, setInput]);

  const onClickOption = (event: MouseEvent<HTMLDivElement>, item: T) => {
    event.preventDefault();
    setSelectedInput(item);
    setShowItems(false);
    inputRef.current!.blur();
  };

  const onInputBlur = () => {
    setShowItems(false);
    const displayValue = selectedInput || '';
    setInput(
      selectedInputFormatter && displayValue
        ? selectedInputFormatter(displayValue)
        : displayValue
    );
  };

  return (
    <div className={classnames(styles.container, className)}>
      <label className={styles.label}>{label}</label>
      <Input
        ref={inputRef}
        onFocus={() => setShowItems(true)}
        onBlur={onInputBlur}
        value={input}
        onChange={onChangeInput}
        placeholder={placeholder}
        className={classnames(
          styles.input,
          showItems && filteredItems.length && styles.listOpen
        )}
      />
      {showItems && (
        <div
          className={classnames(
            styles.listContainer,
            !filteredItems.length && styles.noResults
          )}
        >
          <SearchListItems
            items={filteredItems}
            itemKeyfn={itemKeyfn}
            className={styles.items}
            isAutoCompleteList
          >
            {(item) => (
              <div
                onMouseDown={(event) => onClickOption(event, item)}
                className={
                  equalityFunc(item, selectedInput) ? styles.chosen : ''
                }
              >
                {children(item, equalityFunc(item, selectedInput))}
              </div>
            )}
          </SearchListItems>
        </div>
      )}
    </div>
  );
};

export { AutoComplete };
