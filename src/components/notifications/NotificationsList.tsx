import { useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import classnames from 'classnames';
import { NotificationItem } from '../../components/notifications/NotificationItem';
import { Notification } from '../../types/notification';
import { Loader } from '../../components/Loader';
import { MarkAllReadButton } from './MarkAllReadButton';
import styles from './NotificationsList.module.scss';
import { InfiniteData } from '@tanstack/react-query';

type ListRow =
  | {
      type: 'header';
      data: { title: string; isNew: boolean };
      id: string;
    }
  | {
      type: 'notification';
      data: Notification;
      id: string;
    };

interface NotificationsListProps {
  historicalData: InfiniteData<Notification[], unknown> | undefined;
  unseenNotifications: Notification[];
  newIds: string[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

const NotificationsList = (props: NotificationsListProps) => {
  const { t } = useTranslation();
  const {
    historicalData,
    unseenNotifications,
    newIds,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = props;

  const parentRef = useRef<HTMLDivElement>(null);

  const historicalNotifications = useMemo(() => {
    return historicalData?.pages.flat() ?? [];
  }, [historicalData]);

  const allNotifications = useMemo(() => {
    return [...unseenNotifications, ...historicalNotifications];
  }, [unseenNotifications, historicalNotifications]);

  const newIdsSet = useMemo(() => new Set(newIds), [newIds]);

  // Build virtualized rows (new section based on newIds + historical section)
  const virtualizedItems: ListRow[] = useMemo(() => {
    const rows: ListRow[] = [];

    const newList = allNotifications.filter((notification) =>
      newIdsSet.has(notification.id)
    );
    const oldList = allNotifications.filter(
      (notification) => !newIdsSet.has(notification.id)
    );

    if (newList.length > 0) {
      rows.push({
        type: 'header',
        data: {
          title: t('notifications.list.headerNew', {
            count: newList.length,
          }) as string,
          isNew: true,
        },
        id: 'new-header',
      });

      newList.forEach((notification: Notification) => {
        rows.push({
          type: 'notification',
          data: notification,
          id: notification.id,
        });
      });
    } else {
      rows.push({
        type: 'header',
        data: {
          title: t('notifications.list.headerNone') as string,
          isNew: true,
        },
        id: 'no-new-header',
      });
    }

    if (oldList.length > 0) {
      rows.push({
        type: 'header',
        data: {
          title: t('notifications.list.headerEarlier') as string,
          isNew: false,
        },
        id: 'earlier-header',
      });

      oldList.forEach((notification: Notification) => {
        rows.push({
          type: 'notification',
          data: notification,
          id: notification.id,
        });
      });
    }

    return rows;
  }, [allNotifications, newIdsSet, t]);

  const unreadCount =
    allNotifications.filter((notification) => !notification.read_at).length ??
    0;

  const dataCount = virtualizedItems.length;
  const hasLoaderRow = hasNextPage;
  const totalCount = hasLoaderRow ? dataCount + 1 : dataCount;

  const rowVirtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = virtualizedItems[index];
      if (!item) {
        return 120;
      }

      if (item.type === 'header') {
        return 36;
      } else {
        return 120;
      }
    },
    overscan: 2,
    getItemKey: (index) => {
      if (index >= virtualizedItems.length) {
        return 'loader-row';
      } else {
        return virtualizedItems[index].id;
      }
    },
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Fetch next page only when the loader row becomes the last visible row
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    const last = virtualRows[virtualRows.length - 1];
    if (!last) {
      return;
    }

    const isLoaderRowVisible = last.index >= dataCount;
    if (isLoaderRowVisible) {
      fetchNextPage();
    }
  }, [virtualRows, dataCount, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className={styles.virtualizedContainer}>
      <div ref={parentRef} className={styles.virtualScrollContainer}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualRows.map((virtualRow) => {
            const isLoaderRow = virtualRow.index >= dataCount;

            return (
              <div
                key={virtualRow.key}
                className={styles.virtualRow}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  <div className={styles.loadingMore}>
                    {isFetchingNextPage ? <Loader inside /> : null}
                  </div>
                ) : virtualizedItems[virtualRow.index].type === 'header' ? (
                  <div className={styles.sectionHeader}>
                    <h2
                      className={classnames(styles.sectionTitle, {
                        [styles.lighter]:
                          (
                            virtualizedItems[virtualRow.index].data as {
                              title: string;
                              isNew: boolean;
                            }
                          ).isNew && newIds.length === 0,
                        [styles.earlierTitle]: !(
                          virtualizedItems[virtualRow.index].data as {
                            title: string;
                            isNew: boolean;
                          }
                        ).isNew,
                        [styles.noNewNotifications]:
                          !(
                            virtualizedItems[virtualRow.index].data as {
                              title: string;
                              isNew: boolean;
                            }
                          ).isNew && newIds.length === 0,
                      })}
                    >
                      {
                        (
                          virtualizedItems[virtualRow.index].data as {
                            title: string;
                            isNew: boolean;
                          }
                        ).title
                      }
                    </h2>

                    {(
                      virtualizedItems[virtualRow.index].data as {
                        title: string;
                        isNew: boolean;
                      }
                    ).isNew &&
                      unreadCount > 0 && <MarkAllReadButton />}
                  </div>
                ) : (
                  <NotificationItem
                    notification={
                      virtualizedItems[virtualRow.index].data as Notification
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { NotificationsList };
