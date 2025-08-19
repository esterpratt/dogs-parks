import { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { Settings, Bell } from 'lucide-react';
import { useMutation, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';
import { useVirtualizer } from '@tanstack/react-virtual';
import classnames from 'classnames';
import { Button } from '../components/Button';
import { NotificationsModal } from '../components/notifications/NotificationsModal';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { UserContext } from '../context/UserContext';
import {
  getSeenNotifications,
  getUnseenNotifications,
  markAllAsRead,
  markAllAsSeen,
} from '../services/notifications';
import { Notification } from '../types/notification';
import { queryClient } from '../services/react-query';
import { Loader } from '../components/Loader';
import { ONE_MINUTE } from '../utils/consts';
import styles from './Notifications.module.scss';

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

const Notifications = () => {
  const { user } = useContext(UserContext);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [newIds, setNewIds] = useState<string[]>([]);
  const isMarkingSeenRef = useRef(false);

  const { mutate: markAllAsReadMutation } = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['unseenNotifications', user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['seenNotifications', user?.id],
      });
    },
  });

  const { mutateAsync: markAllAsSeenMutation } = useMutation({
    mutationFn: markAllAsSeen,
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['unseenNotifications', user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['seenNotifications', user?.id],
      });

      if (Capacitor.isNativePlatform()) {
        try {
          await Badge.clear();
        } catch (error) {
          console.error('Failed to clear badge count:', error);
        }
      }
    },
  });

  // Unseen notifications query (refetches every 30s)
  const {
    data: unseenNotifications = [],
    isLoading: isLoadingUnseen,
  } = useQuery({
    queryKey: ['unseenNotifications', user?.id],
    queryFn: () => getUnseenNotifications(user!.id),
    enabled: !!user,
    refetchInterval: ONE_MINUTE / 2,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  // Historical notifications query (infinite, no refetch)
  const {
    data: historicalData,
    status: historicalStatus,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['seenNotifications', user?.id],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getSeenNotifications({ userId: user!.id, limit: 10, cursor: pageParam }),
    getNextPageParam: (lastPage: Notification[]) => {
      if (lastPage.length < 10) {
        return undefined;
      }

      return lastPage[lastPage.length - 1].created_at;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - allows invalidation to work
  });

  const historicalNotifications = useMemo(
    () => historicalData?.pages.flat() ?? [],
    [historicalData]
  );

  const allNotifications = useMemo(
    () => [...unseenNotifications, ...historicalNotifications],
    [unseenNotifications, historicalNotifications]
  );

  // Capture unseen notifications as 'new' and mark them as seen
  useEffect(() => {
    if (!user?.id || unseenNotifications.length === 0) {
      return;
    }

    // Add new unseen notification IDs to newIds state
    const unseenIds = unseenNotifications.map(n => n.id);
    setNewIds(prev => {
      const merged = new Set([...prev, ...unseenIds]);
      return Array.from(merged);
    });

    // Mark as seen if not already doing so
    if (!isMarkingSeenRef.current) {
      const markNow = async () => {
        isMarkingSeenRef.current = true;

        try {
          await markAllAsSeenMutation();
        } catch (error) {
          console.error('Failed to mark notifications as seen:', error);
        } finally {
          isMarkingSeenRef.current = false;
        }
      };

      markNow();
    }
  }, [unseenNotifications, user?.id, markAllAsSeenMutation]);

  // Build virtualized rows (new section based on newIds + historical section)
  const virtualizedItems: ListRow[] = useMemo(() => {
    const rows: ListRow[] = [];

    // Combine all notifications and separate by newIds
    const newList = allNotifications.filter(n => newIds.includes(n.id));
    const oldList = allNotifications.filter(n => !newIds.includes(n.id));

    // Add new notifications section
    if (newList.length > 0) {
      rows.push({
        type: 'header',
        data: {
          title: `${newList.length} new notification${newList.length !== 1 ? 's' : ''}`,
          isNew: true,
        },
        id: 'new-header',
      });

      newList.forEach((notification: Notification) => {
        rows.push({ type: 'notification', data: notification, id: notification.id });
      });
    } else {
      rows.push({
        type: 'header',
        data: { title: 'No new notifications', isNew: true },
        id: 'no-new-header',
      });
    }

    // Add historical notifications section
    if (oldList.length > 0) {
      rows.push({
        type: 'header',
        data: { title: 'Earlier', isNew: false },
        id: 'earlier-header',
      });

      oldList.forEach((notification: Notification) => {
        rows.push({ type: 'notification', data: notification, id: notification.id });
      });
    }

    return rows;
  }, [allNotifications, newIds]);

  const unreadCount =
    allNotifications?.filter((notification) => !notification.read_at).length ?? 0;

  const parentRef = useRef<HTMLDivElement>(null);

  // --- Loader row pattern (sentinel) ---
  const dataCount = virtualizedItems.length;
  const totalCount = hasNextPage ? dataCount + 1 : dataCount; // +1 = loader row

  const rowVirtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = virtualizedItems[index];
      return item?.type === 'header' ? 60 : 120;
    },
    overscan: 2,
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

  const showLoader =
    isLoadingUnseen || (historicalStatus === 'pending' && unseenNotifications.length === 0);
  const showContent = !isLoadingUnseen && (unseenNotifications.length > 0 || historicalStatus === 'success');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Notifications</h1>
          <Button
            variant="simple"
            onClick={() => setIsSettingsModalOpen(true)}
            className={styles.settingsButton}
          >
            <Settings size={24} />
          </Button>
        </div>
      </div>

      {showLoader ? (
        <Loader inside className={styles.loader} />
      ) : showContent ? (
        <div className={styles.content}>
          {!allNotifications?.length ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Bell size={64} />
              </div>
              <div className={styles.emptyText}>You have no notifications</div>
            </div>
          ) : (
            <div className={styles.virtualizedContainer}>
              {unreadCount > 0 && (
                <div className={styles.markAllContainer}>
                  <Button
                    variant="simple"
                    onClick={() => {
                      if (user?.id) {
                        markAllAsReadMutation();
                      }
                    }}
                    className={styles.markAllButton}
                  >
                    Mark all as read
                  </Button>
                </div>
              )}

              <div ref={parentRef} className={styles.virtualScrollContainer}>
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualRows.map((virtualRow) => {
                    const isLoaderRow = virtualRow.index > dataCount - 1;

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
                            {hasNextPage
                              ? 'Loading more…'
                              : 'Nothing more to load'}
                          </div>
                        ) : virtualizedItems[virtualRow.index].type ===
                          'header' ? (
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
                          </div>
                        ) : (
                          <NotificationItem
                            notification={
                              virtualizedItems[virtualRow.index]
                                .data as Notification
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <NotificationsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default Notifications;
