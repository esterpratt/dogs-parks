import { ReactNode, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './SearchListInfiniteItems.module.scss';

// row height should include padding
const DEFAULT_ROW_HEIGHT = 194 + 24;

interface SearchListInfiniteItemsProps<T> {
  items: T[];
  children: (item: T) => ReactNode;
  rowSize?: number;
}

const SearchListInfiniteItems = <T,>({
  items,
  children,
  rowSize = DEFAULT_ROW_HEIGHT,
}: SearchListInfiniteItemsProps<T>) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowSize,
  });

  return (
    <div ref={parentRef} className={styles.infiniteListContainer}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
        className={styles.infiniteList}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            className={styles.rowContainer}
            data-index={virtualRow.index}
            style={{
              transform: `translateY(${virtualRow.start}px)`,
            }}
            ref={rowVirtualizer.measureElement}
          >
            {children(items[virtualRow.index])}
          </div>
        ))}
      </div>
    </div>
  );
};

export { SearchListInfiniteItems };
