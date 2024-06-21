import { ReactNode } from 'react';
import classnames from 'classnames';
import styles from './SearchListItems.module.scss';

interface SearchListItemProps<T> {
  items: T[];
  className?: string;
  itemKeyfn: (item: T) => string;
  children: (item: T) => ReactNode;
}

const SearchListItems = <T,>({
  items,
  itemKeyfn,
  children,
  className,
}: SearchListItemProps<T>) => {
  return (
    <ul className={classnames(styles.list, className)}>
      {items.map((item) => (
        <li key={itemKeyfn(item)}>{children(item)}</li>
      ))}
    </ul>
  );
};

export { SearchListItems };
