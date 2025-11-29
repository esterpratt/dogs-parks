import { UserPlus, Heart, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useContext } from 'react';
import classnames from 'classnames';
import { Notification, NotificationType } from '../../types/notification';
import { useDateUtils } from '../../hooks/useDateUtils';
import { markAsRead } from '../../services/notifications';
import { queryClient } from '../../services/react-query';
import { UserContext } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { translateNotification } from '../../utils/translateNotification';
import styles from './NotificationItem.module.scss';

interface NotificationItemProps {
  notification: Notification;
}

interface NotificationConfig {
  icon: LucideIcon;
  iconStyle: string;
  getUrl: (notification: Notification) => string | null;
  invalidateQueries: (userId: string) => void;
}

const getNotificationConfig = (type: NotificationType): NotificationConfig => {
  switch (type) {
    case NotificationType.FRIEND_REQUEST:
      return {
        icon: UserPlus,
        iconStyle: styles.friendRequest,
        getUrl: (notification) => `/profile/${notification.sender_id}`,
        invalidateQueries: (userId) => {
          queryClient.invalidateQueries({
            queryKey: ['friendsWithDogs', userId, 'PENDING', 'REQUESTER'],
          });
          queryClient.invalidateQueries({
            queryKey: ['friendshipMap', userId],
          });
        },
      };
    case NotificationType.FRIEND_APPROVAL:
      return {
        icon: Heart,
        iconStyle: styles.friendApproval,
        getUrl: (notification) => `/profile/${notification.sender_id}`,
        invalidateQueries: (userId) => {
          queryClient.invalidateQueries({
            queryKey: ['friendsWithDogs', userId],
          });
          queryClient.invalidateQueries({
            queryKey: ['friendshipMap', userId],
          });
        },
      };
    case NotificationType.PARK_INVITE:
      return {
        icon: Heart,
        iconStyle: styles.friendApproval,
        getUrl: (notification) => `/profile/${notification.sender_id}`,
        invalidateQueries: (userId) => {
          queryClient.invalidateQueries({
            queryKey: ['friendsWithDogs', userId],
          });
          queryClient.invalidateQueries({
            queryKey: ['friendshipMap', userId],
          });
        },
      };
    default:
      return {
        icon: Heart,
        iconStyle: styles.friendApproval,
        getUrl: () => null,
        invalidateQueries: () => {},
      };
  }
};

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['unseenNotifications', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['seenNotifications', userId],
      });
    },
  });

  const handleClick = () => {
    if (!read_at) {
      markAsReadMutation();
    }

    if (userId) {
      config.invalidateQueries(userId);
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
        <div className={classnames(styles.notificationIcon, config.iconStyle)}>
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
