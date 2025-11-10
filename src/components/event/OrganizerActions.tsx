import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { cancelEvent } from '../../services/events';
import { queryClient } from '../../services/react-query';
import { useNotification } from '../../context/NotificationContext';
import { TopModal } from '../modals/TopModal';
import { Loader } from '../Loader';
import { Button } from '../Button';
import styles from './OrganizerActions.module.scss';

interface OrganizerActionsProps {
  eventId: string;
  userId: string;
  onSaveEvent: () => void;
  disableSaveButton?: boolean;
  isPendingSave?: boolean;
  showSaveButton?: boolean;
}

const OrganizerActions = (props: OrganizerActionsProps) => {
  const {
    eventId,
    userId,
    onSaveEvent,
    disableSaveButton,
    isPendingSave,
    showSaveButton,
  } = props;
  const [isCancelEventModalOpen, setIsCancelEventModalOpen] = useState(false);

  const { t } = useTranslation();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const { mutate, isPending } = useMutation({
    mutationFn: () => cancelEvent(eventId),
    onError: () => {
      notify(t('event.cancel.error'), true);
    },
    onSuccess: () => {
      notify(t('event.cancel.success'));
      queryClient.invalidateQueries({
        queryKey: ['events', 'organized', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['event', eventId],
      });
      navigate(`/profile/${userId}/events`);
    },
    onSettled: () => {
      setIsCancelEventModalOpen(false);
    },
  });

  const handleCancelEvent = () => {
    mutate();
  };

  return (
    <>
      <div className={styles.buttonsContainer}>
        {showSaveButton && (
          <Button
            disabled={disableSaveButton || isPendingSave}
            onClick={onSaveEvent}
          >
            {isPendingSave ? (
              <Loader variant="secondary" inside className={styles.loader} />
            ) : (
              <span>{t('event.save.buttonTxt')}</span>
            )}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => setIsCancelEventModalOpen(true)}
        >
          {t('event.cancel.buttonTxt')}
        </Button>
      </div>
      <TopModal
        open={isCancelEventModalOpen}
        onClose={() => setIsCancelEventModalOpen(false)}
      >
        <div className={styles.cancelModal}>
          <div>
            <span>{t('event.cancel.title')}</span>
          </div>
        </div>
        <div className={styles.buttonsContainer}>
          <Button
            variant="primary"
            onClick={handleCancelEvent}
            className={styles.modalButton}
            disabled={isPending}
          >
            {isPending ? (
              <Loader variant="secondary" inside className={styles.loader} />
            ) : (
              <span>{t('event.cancel.button')}</span>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsCancelEventModalOpen(false)}
            className={styles.modalButton}
            disabled={isPending}
          >
            <span>{t('common.actions.cancel')}</span>
          </Button>
        </div>
      </TopModal>
    </>
  );
};

export { OrganizerActions };
