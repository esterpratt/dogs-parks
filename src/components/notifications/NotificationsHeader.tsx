import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '../Button';
import { NotificationsModal } from './NotificationsModal';
import styles from './NotificationsHeader.module.scss';

const NotificationsHeader = () => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{t('notifications.title')}</h1>
          <Button
            variant="secondary"
            onClick={() => setIsSettingsModalOpen(true)}
            className={styles.settingsButton}
            aria-label={t('common.actions.openSettings')}
          >
            <Settings size={18} />
          </Button>
        </div>
      </div>
      <NotificationsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
};

export { NotificationsHeader };
