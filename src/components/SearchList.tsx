import { ChangeEvent, ReactNode, useState } from 'react';
import classnames from 'classnames';
import { useDebounce } from '../hooks/useDebounce';
import styles from './SearchList.module.scss';

interface SearchListProps<T> {
  items: T[];
  placeholder?: string;
  containerClassName?: string;
  itemKeyfn: (item: T) => string;
  filterFunc: (item: T, searchInput: string) => boolean;
  children: (item: T) => ReactNode;
}

const SearchList = <T,>({
  items,
  placeholder = 'Search',
  filterFunc,
  itemKeyfn,
  containerClassName,
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
      <input
        value={input}
        onChange={onChangeInput}
        placeholder={placeholder}
        className={styles.input}
      />
      <ul className={styles.list}>
        {filteredItems.map((item) => (
          <li key={itemKeyfn(item)} className={styles.item}>
            {children(item)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export { SearchList };
