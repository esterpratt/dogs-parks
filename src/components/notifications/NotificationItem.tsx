import { useNavigate } from 'react-router-dom';
import { useMutation, type InfiniteData } from '@tanstack/react-query';
import { useContext } from 'react';
import classnames from 'classnames';
import { Notification } from '../../types/notification';
import { useDateUtils } from '../../hooks/useDateUtils';
import { markAsRead } from '../../services/notifications';
import { queryClient } from '../../services/react-query';
import { UserContext } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { translateNotification } from '../../utils/translateNotification';
import { getNotificationConfig } from '../../utils/notificationConfig';
import styles from './NotificationItem.module.scss';

interface NotificationItemProps {
  notification: Notification;
}

const NotificationItem = ({ notification }: NotificationItemProps) => {
  const {
    type,
    read_at,
    created_at,
    sender,
    title: serverTitle,
    app_message,
  } = notification;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getFormattedPastDate } = useDateUtils();
  const { userId } = useContext(UserContext);

  const config = getNotificationConfig(type);
  const IconComponent = config.icon;
  const url = config.getUrl(notification);

  const { title, appMessage } = translateNotification({
    type,
    senderName: sender?.name ?? null,
    serverTitle,
    serverAppMessage: app_message,
    t,
  });

  const { mutate: markAsReadMutation } = useMutation({
    mutationFn: () => markAsRead({ notificationId: notification.id }),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['unseenNotifications', userId],
      });
      await queryClient.cancelQueries({
        queryKey: ['seenNotifications', userId],
      });

      // Snapshot previous values for rollback
      const prevUnseen = queryClient.getQueryData([
        'unseenNotifications',
        userId,
      ]);
      const prevSeen = queryClient.getQueryData([
        'seenNotifications',
        userId,
      ]);

      const now = new Date().toISOString();

      // Optimistically update unseenNotifications
      queryClient.setQueryData(
        ['unseenNotifications', userId],
        (old: Notification[] | undefined) => {
          if (!old) {
            return old;
          }
          return old.map((n) =>
            n.id === notification.id ? { ...n, read_at: now } : n
          );
        }
      );

      // Optimistically update seenNotifications (infinite query)
      queryClient.setQueryData(
        ['seenNotifications', userId],
        (old: InfiniteData<Notification[]> | undefined) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((n) =>
                n.id === notification.id ? { ...n, read_at: now } : n
              )
            ),
          };
        }
      );

      return { prevUnseen, prevSeen };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.prevUnseen) {
        queryClient.setQueryData(
          ['unseenNotifications', userId],
          context.prevUnseen
        );
      }
      if (context?.prevSeen) {
        queryClient.setQueryData(['seenNotifications', userId], context.prevSeen);
      }
    },
  });

  const handleClick = () => {
    if (!read_at) {
      markAsReadMutation();
    }

    if (userId) {
      config.invalidateQueries(userId, notification);
    }

    if (url) {
      navigate(url);
    }
  };

  return (
    <button
      className={classnames(styles.notificationCard, {
        [styles.unread]: !read_at,
        [styles.read]: !!read_at,
      })}
      onClick={handleClick}
      type="button"
    >
      <div className={styles.notificationContent}>
        <div
          className={classnames(styles.notificationIcon, styles[config.color])}
        >
          <IconComponent size={24} />
        </div>
        <div className={styles.content}>
          <div className={styles.titleRow}>
            <div className={styles.title}>{title}</div>
          </div>
          <div className={styles.message}>{appMessage}</div>
          <div className={styles.timestamp}>
            {getFormattedPastDate(new Date(created_at))}
          </div>
        </div>
      </div>
    </button>
  );
};

export { NotificationItem };
