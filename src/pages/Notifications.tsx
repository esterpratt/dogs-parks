import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { Notification } from '../types/notification';
import { useMarkNotificationsAsSeen } from '../hooks/api/useMarkNotificationsAsSeen';
import { useUnseenNotifications } from '../hooks/api/useUnseenNotifications';
import { useSeenNotifications } from '../hooks/api/useSeenNotifications';
import { NotificationsList } from '../components/notifications/NotificationsList';
import { NotificationsHeader } from '../components/notifications/NotificationsHeader';
import styles from './Notifications.module.scss';

const Notifications = () => {
  const { t } = useTranslation();

  // store IDs for "new in this session"
  const [sessionNewIds, setSessionNewIds] = useState<string[]>([]);

  const { markNotificationsAsSeen } = useMarkNotificationsAsSeen();

  const { unseenNotifications, isLoading: isLoadingUnseen } =
    useUnseenNotifications();

  const {
    historicalData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    historicalStatus,
  } = useSeenNotifications();

  useEffect(() => {
    if (!unseenNotifications || unseenNotifications.length === 0) {
      return;
    }

    const existingSessionIdSet = new Set(sessionNewIds);
    const newArrivals = unseenNotifications.filter(
      (notification) => !existingSessionIdSet.has(notification.id)
    );

    if (newArrivals.length === 0) {
      return;
    }

    setSessionNewIds((prevIds) => [
      ...newArrivals.map((notification) => notification.id),
      ...prevIds,
    ]);

    const newIds = newArrivals.map((notification) => notification.id);
    markNotificationsAsSeen({ notificationIds: newIds });
  }, [unseenNotifications, sessionNewIds, markNotificationsAsSeen]);

  const historicalNotifications = useMemo(() => {
    return historicalData?.pages.flat() ?? [];
  }, [historicalData]);

  // Build a combined list from unseen + seen,
  const allNotifications = useMemo(() => {
    const combined = [...unseenNotifications, ...historicalNotifications];

    const notificationsById = new Map<string, Notification>();
    for (const notification of combined) {
      notificationsById.set(notification.id, notification);
    }

    const deduped = Array.from(notificationsById.values());

    deduped.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return timeB - timeA;
    });

    return deduped;
  }, [unseenNotifications, historicalNotifications]);

  const isLoading = isLoadingUnseen || historicalStatus === 'pending';

  return (
    <div className={styles.container}>
      <NotificationsHeader />
      <div className={styles.content}>
        {!allNotifications.length && !isLoading ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Bell size={64} />
            </div>
            <div className={styles.emptyText}>{t('notifications.empty')}</div>
          </div>
        ) : (
          <NotificationsList
            notifications={allNotifications}
            newIds={sessionNewIds}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        )}
      </div>
    </div>
  );
};

export default Notifications;
