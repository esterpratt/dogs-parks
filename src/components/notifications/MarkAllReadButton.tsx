import { useContext } from 'react';
import { useMarkAllNotificationsAsRead } from '../../hooks/api/useMarkAllNotificationsAsRead';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import styles from './MarkAllReadButton.module.scss';

const MarkAllReadButton = () => {
  const { userId } = useContext(UserContext);
  const { markAllNotificationsAsRead } = useMarkAllNotificationsAsRead();

  return (
    <Button
      variant="simple"
      onClick={() => {
        if (userId) {
          markAllNotificationsAsRead();
        }
      }}
      className={styles.markAllButton}
    >
      Mark all as read
    </Button>
  );
};

export { MarkAllReadButton };
