import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarkAllNotificationsAsRead } from '../../hooks/api/useMarkAllNotificationsAsRead';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import styles from './MarkAllReadButton.module.scss';

const MarkAllReadButton = () => {
  const { userId } = useContext(UserContext);
  const { markAllNotificationsAsRead } = useMarkAllNotificationsAsRead();
  const { t } = useTranslation();

  return (
    <Button
      variant="simple"
      onClick={() => {
        if (userId) {
          markAllNotificationsAsRead();
        }
      }}
      className={styles.markAllButton}
      aria-label={t('notifications.actions.markAllRead')}
    >
      {t('notifications.actions.markAllRead')}
    </Button>
  );
};

export { MarkAllReadButton };
