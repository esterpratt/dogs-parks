import { MouseEvent, ReactNode, useRef, useState } from 'react';
import { X } from 'lucide-react';
import classnames from 'classnames';
import { Input } from './Input';
import { SearchListItems } from '../searchList/SearchListItems';
import { useAutoComplete } from '../../hooks/useAutoComplete';
import styles from './AutoComplete.module.scss';

interface AutoCompleteMultiSelectProps<T> {
  selectedInputs?: T[];
  items: T[];
  placeholder?: string;
  className?: string;
  label: string;
  itemKeyfn: (item: T) => string;
  selectedItemKeyfn: (item: T) => string;
  onSelectItem: (item: T) => void;
  onRemoveItem: (item: T) => void;
  equalityFunc: (item: T, selectedInputs?: T[]) => boolean;
  filterFunc: (item: T, searchInput: string) => boolean;
  children: (item: T, isChosen: boolean) => ReactNode;
  selectedInputsFormatter: (selectedInput: T) => string;
}

const AutoCompleteMultiSelect = <T,>({
  items,
  selectedInputs,
  placeholder,
  className,
  itemKeyfn,
  selectedItemKeyfn,
  label,
  filterFunc,
  onSelectItem,
  onRemoveItem,
  equalityFunc,
  children,
  selectedInputsFormatter,
}: AutoCompleteMultiSelectProps<T>) => {
  const { input, filteredItems, onChangeInput } = useAutoComplete({
    items,
    filterFunc,
  });

  const [showItems, setShowItems] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onClickOption = (event: MouseEvent<HTMLDivElement>, item: T) => {
    event.preventDefault();
    onSelectItem(item);
    setShowItems(false);
    inputRef.current!.blur();
  };

  const onInputBlur = () => {
    setShowItems(false);
  };

  return (
    <>
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
                    equalityFunc(item, selectedInputs) ? styles.chosen : ''
                  }
                >
                  {children(item, equalityFunc(item, selectedInputs))}
                </div>
              )}
            </SearchListItems>
          </div>
        )}
      </div>

      <ul className={styles.selectedInputs}>
        {selectedInputs?.map((item) => (
          <li className={styles.selectedInput} key={selectedItemKeyfn(item)}>
            <span>{selectedInputsFormatter(item)}</span>
            <button onClick={() => onRemoveItem(item)}>
              <X />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};

export { AutoCompleteMultiSelect };
