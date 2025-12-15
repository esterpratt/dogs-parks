import { useContext } from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useMarkAllNotificationsAsRead } from '../../hooks/api/useMarkAllNotificationsAsRead';
import { Button } from '../Button';
import { UserContext } from '../../context/UserContext';
import styles from './MarkAllReadButton.module.scss';

interface MarkAllReadButtonProps {
  className?: string;
}

const MarkAllReadButton = (props: MarkAllReadButtonProps) => {
  const { className } = props;
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
      className={classnames(styles.markAllButton, className)}
      aria-label={t('notifications.actions.markAllRead')}
    >
      {t('notifications.actions.markAllRead')}
    </Button>
  );
};

export { MarkAllReadButton };
