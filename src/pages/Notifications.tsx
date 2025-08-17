import { useState, useContext, useEffect, useRef } from 'react';
import { Settings, Bell } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';
import { Button } from '../components/Button';
import { NotificationsModal } from '../components/notifications/NotificationsModal';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { UserContext } from '../context/UserContext';
import {
  getNotifications,
  markAllAsRead,
  markAllAsSeen,
} from '../services/notifications';
import { Notification } from '../types/notification';
import { queryClient } from '../services/react-query';
import { Loader } from '../components/Loader';
import { ONE_MINUTE } from '../utils/consts';
import styles from './Notifications.module.scss';

const Notifications = () => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [initialNewNotificationIds, setInitialNewNotificationIds] = useState<
    string[]
  >([]);
  const { user } = useContext(UserContext);
  const markSeenInFlight = useRef(false);
  const capturedInitialRef = useRef(false);

  // Reset initial snapshot when the user changes
  useEffect(() => {
    capturedInitialRef.current = false;
    setInitialNewNotificationIds([]);
  }, [user?.id]);

  const { mutate: markAllAsReadMutation } = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications', user?.id ?? 'anon'],
      });
    },
  });

  const { mutateAsync: markAllAsSeenMutation } = useMutation({
    mutationFn: markAllAsSeen,
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications', user?.id ?? 'anon'],
      });
      queryClient.invalidateQueries({
        queryKey: ['notificationCount', user?.id ?? 'anon'],
      });

      if (Capacitor.isNativePlatform()) {
        try {
          await Badge.clear();
        } catch (error) {
          console.error('Failed to clear badge count:', error);
        }
      }
    },
    onSettled: () => {
      markSeenInFlight.current = false;
    },
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id ?? 'anon'],
    queryFn: () => getNotifications({ userId: user!.id }),
    enabled: !!user,
    staleTime: 0,
    refetchInterval: ONE_MINUTE / 2,
    refetchIntervalInBackground: false,
  });

  // Capture initial unseen notification IDs once per screen entry
  useEffect(() => {
    if (!capturedInitialRef.current && notifications.length > 0) {
      const unseenIdsAtEntry = notifications
        .filter((notification) => !notification.seen_at)
        .map((notification) => notification.id);

      setInitialNewNotificationIds(unseenIdsAtEntry);
      capturedInitialRef.current = true;
    }
  }, [notifications]);

  // Auto-mark unseen as seen when landing / when unseen appear
  useEffect(() => {
    if (!user?.id || notifications.length === 0 || markSeenInFlight.current) {
      return;
    }

    const hasUnseenNotifications = notifications.some(
      (notification) => !notification.seen_at
    );

    if (!hasUnseenNotifications) {
      return;
    }

    markSeenInFlight.current = true;

    const runMarkAllAsSeen = async () => {
      try {
        await markAllAsSeenMutation();
      } catch (error) {
        console.error('Failed to mark all as seen:', error);
      }
    };

    runMarkAllAsSeen();
  }, [notifications, user?.id, markAllAsSeenMutation]);

  const newNotifications = notifications.filter((notification) =>
    initialNewNotificationIds.includes(notification.id)
  );

  const oldNotifications = notifications.filter(
    (notification) => !initialNewNotificationIds.includes(notification.id)
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.read_at
  ).length;

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
        {notifications.length > 0 && (
          <div className={styles.notificationActions}>
            <span className={styles.unreadCount}>
              {newNotifications.length > 0 ? newNotifications.length : 'No'} new
              notification{newNotifications.length !== 1 ? 's' : ''}
            </span>
            {unreadCount > 0 && (
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
            )}
          </div>
        )}
      </div>
      <div className={styles.notificationsList}>
        {isLoading ? (
          <Loader />
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Bell size={64} />
            </div>
            <div className={styles.emptyText}>You have no notifications</div>
          </div>
        ) : (
          <>
            {newNotifications.map((notification: Notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
            {oldNotifications.length > 0 && (
              <div className={styles.earlierDivider}>
                <span>Earlier</span>
              </div>
            )}
            {oldNotifications.map((notification: Notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </>
        )}
      </div>
      <NotificationsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default Notifications;
