import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '../Button';
import { NotificationsModal } from './NotificationsModal';
import { MarkAllReadButton } from './MarkAllReadButton';
import styles from './NotificationsHeader.module.scss';

interface NotificationsHeaderProps {
  showReadButton: boolean;
}

const NotificationsHeader = (props: NotificationsHeaderProps) => {
  const { showReadButton } = props;
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.leftPart}>
            <h1 className={styles.title}>{t('notifications.title')}</h1>
            <div className={styles.readButton}>
              {showReadButton && <MarkAllReadButton />}
            </div>
          </div>
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
