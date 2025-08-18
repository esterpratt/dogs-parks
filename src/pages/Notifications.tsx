import { useState, useContext, useEffect, useRef } from 'react';
import { Settings, Bell } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';
import classnames from 'classnames';
import { Button } from '../components/Button';
import { NotificationsModal } from '../components/notifications/NotificationsModal';
import { NotificationsList } from '../components/notifications/NotificationsList';
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
import { useDelayedLoading } from '../hooks/useDelayedLoading';

const Notifications = () => {
  const { user } = useContext(UserContext);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [newIds, setNewIds] = useState<string[]>([]);
  const isMarkingSeenRef = useRef(false);

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
  });

  const { data: notifications, isFetching } = useQuery({
    queryKey: ['notifications', user?.id ?? 'anon'],
    queryFn: () => getNotifications({ userId: user!.id }),
    enabled: !!user,
    staleTime: 0,
    refetchInterval: ONE_MINUTE / 2,
    refetchIntervalInBackground: false,
  });

  const { showLoader } = useDelayedLoading({
    isLoading: !notifications || isFetching,
    minDuration: 300,
    threshold: 0,
    showFromStart: true,
  });

  // On fetch/update:
  // 1) Add unseen-at-entry to New (first load)
  // 2) Add any newly arrived unseen to New
  // 3) If any unseen exist, mark all as seen immediately (guarded)
  useEffect(() => {
    if (!user?.id) {
      return;
    }

    if (!notifications || notifications.length === 0) {
      return;
    }

    // Step 1 + 2: capture unseen-at-entry and any newly arrived unseen
    const unseenIds = notifications
      .filter((notification) => !notification.seen_at)
      .map((notification) => notification.id);

    if (unseenIds.length > 0) {
      setNewIds((prevNewIds) => {
        const merged = new Set([...prevNewIds, ...unseenIds]);
        return Array.from(merged);
      });
    }

    // Step 3: mark as seen immediately whenever there are unseen items
    if (unseenIds.length > 0 && !isMarkingSeenRef.current) {
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
  }, [notifications, user?.id, markAllAsSeenMutation]);

  const newNotifications: Notification[] =
    notifications?.filter((notification) => newIds.includes(notification.id)) ??
    [];

  const oldNotifications: Notification[] =
    notifications?.filter(
      (notification) => !newIds.includes(notification.id)
    ) ?? [];

  const unreadCount = notifications
    ? notifications.filter((notification) => !notification.read_at).length
    : 0;

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
      ) : (
        <div className={styles.content}>
          {!notifications || notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Bell size={64} />
              </div>
              <div className={styles.emptyText}>You have no notifications</div>
            </div>
          ) : (
            <>
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2
                    className={classnames(styles.sectionTitle, {
                      [styles.lighter]: newNotifications.length === 0,
                    })}
                  >
                    {newNotifications.length > 0
                      ? newNotifications.length
                      : 'No'}{' '}
                    new notification{newNotifications.length !== 1 ? 's' : ''}
                  </h2>
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
                {newNotifications.length > 0 && (
                  <div className={styles.notificationsList}>
                    <NotificationsList notifications={newNotifications} />
                  </div>
                )}
              </div>
              {oldNotifications.length > 0 && (
                <div className={styles.section}>
                  <h2
                    className={classnames(
                      styles.sectionTitle,
                      styles.earlierTitle
                    )}
                  >
                    Earlier
                  </h2>
                  <div className={styles.notificationsList}>
                    <NotificationsList notifications={oldNotifications} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      <NotificationsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default Notifications;
