import { useState, useContext, useEffect, useMemo } from 'react';
import { Settings, Bell } from 'lucide-react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Button } from '../components/Button';
import { NotificationsModal } from '../components/notifications/NotificationsModal';
import { UserContext } from '../context/UserContext';
import {
  getSeenNotifications,
  getUnseenNotifications,
} from '../services/notifications';
import { Notification } from '../types/notification';
import { Loader } from '../components/Loader';
import { ONE_MINUTE } from '../utils/consts';
import styles from './Notifications.module.scss';
import { useMarkAllNotificationsAsSeen } from '../hooks/api/useMarkAllNotificationsAsSeen';
import { NotificationsList } from '../components/notifications/NotificationsList';

const Notifications = () => {
  const { user } = useContext(UserContext);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [newIds, setNewIds] = useState<string[]>([]);

  const { markAllNotificationsAsSeen, isMarkingSeen } =
    useMarkAllNotificationsAsSeen();

  const { data: unseenNotifications = [], isLoading: isLoadingUnseen } =
    useQuery({
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
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getSeenNotifications({ userId: user!.id, limit: 20, cursor: pageParam }),
    getNextPageParam: (lastPage: Notification[]) => {
      if (lastPage.length < 20) {
        return undefined;
      }
      return lastPage[lastPage.length - 1].created_at;
    },
    enabled: !!user,
  });

  const historicalNotifications = useMemo(() => {
    return historicalData?.pages.flat() ?? [];
  }, [historicalData]);

  const allNotifications = useMemo(() => {
    return [...unseenNotifications, ...historicalNotifications];
  }, [unseenNotifications, historicalNotifications]);

  // Capture unseen notifications as 'new' and then mark them as seen
  useEffect(() => {
    if (!user?.id || unseenNotifications.length === 0 || isMarkingSeen) {
      return;
    }

    const unseenIds = unseenNotifications.map(
      (notification) => notification.id
    );
    setNewIds((prev) => {
      const merged = new Set([...prev, ...unseenIds]);
      return Array.from(merged);
    });

    // Ensure state commit before optimistic updates/invalidations
    requestAnimationFrame(() => {
      markAllNotificationsAsSeen();
    });
  }, [
    unseenNotifications,
    user?.id,
    isMarkingSeen,
    markAllNotificationsAsSeen,
  ]);

  const showLoader =
    isLoadingUnseen ||
    (historicalStatus === 'pending' && unseenNotifications.length === 0);

  const showContent =
    !isLoadingUnseen &&
    (unseenNotifications.length > 0 || historicalStatus === 'success');

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
          {!allNotifications.length ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Bell size={64} />
              </div>
              <div className={styles.emptyText}>You have no notifications</div>
            </div>
          ) : (
            <NotificationsList
              historicalData={historicalData}
              unseenNotifications={unseenNotifications}
              newIds={newIds}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
            />
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
