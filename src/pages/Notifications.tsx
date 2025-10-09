import { useState, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useMarkAllNotificationsAsSeen } from '../hooks/api/useMarkAllNotificationsAsSeen';
import { NotificationsList } from '../components/notifications/NotificationsList';
import styles from './Notifications.module.scss';

const Notifications = () => {
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [newIds, setNewIds] = useState<string[]>([]);

  const { markAllNotificationsAsSeen, isMarkingSeen } =
    useMarkAllNotificationsAsSeen();

  const { data: unseenNotifications = [], isLoading: isLoadingUnseen } =
    useQuery({
      queryKey: ['unseenNotifications', userId],
      queryFn: () => getUnseenNotifications(userId!),
      enabled: !!userId,
    });

  // Historical notifications query (infinite, no refetch)
  const {
    data: historicalData,
    status: historicalStatus,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['seenNotifications', userId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getSeenNotifications({ userId: userId!, limit: 20, cursor: pageParam }),
    getNextPageParam: (lastPage: Notification[]) => {
      if (lastPage.length < 20) {
        return undefined;
      }
      return lastPage[lastPage.length - 1].created_at;
    },
    enabled: !!userId,
  });

  const historicalNotifications = useMemo(() => {
    return historicalData?.pages.flat() ?? [];
  }, [historicalData]);

  const allNotifications = useMemo(() => {
    return [...unseenNotifications, ...historicalNotifications];
  }, [unseenNotifications, historicalNotifications]);

  // Capture unseen notifications as 'new' and then mark them as seen
  useEffect(() => {
    if (!userId || unseenNotifications.length === 0 || isMarkingSeen) {
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
  }, [unseenNotifications, userId, isMarkingSeen, markAllNotificationsAsSeen]);

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
          <h1 className={styles.title}>{t('notifications.title')}</h1>
          <Button
            variant="simple"
            onClick={() => setIsSettingsModalOpen(true)}
            className={styles.settingsButton}
            aria-label={t('common.actions.openSettings')}
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
              <div className={styles.emptyText}>{t('notifications.empty')}</div>
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
