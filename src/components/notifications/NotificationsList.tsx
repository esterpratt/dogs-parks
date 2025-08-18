import { Notification } from '../../types/notification';
import { NotificationItem } from './NotificationItem';
import styles from './NotificationsList.module.scss';

interface NotificationsListProps {
  notifications: Notification[];
}

const NotificationsList = ({ notifications }: NotificationsListProps) => {
  return (
    <div className={styles.list}>
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

export { NotificationsList };
