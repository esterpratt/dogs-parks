import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { cancelEvent } from '../../services/events';
import { queryClient } from '../../services/react-query';
import { useNotification } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmModalContext';
import { ParkEventStatus } from '../../types/parkEvent';
import { Button } from '../Button';
import styles from './OrganizerActions.module.scss';

interface OrganizerActionsProps {
  eventId: string;
  userId: string;
  status: ParkEventStatus;
  isEventEnded?: boolean;
}

const OrganizerActions = (props: OrganizerActionsProps) => {
  const { eventId, userId, status, isEventEnded } = props;
  const { showModal } = useConfirm();

  const { t } = useTranslation();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const { mutate } = useMutation({
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
  });

  const handleOpenConfirmModal = () => {
    showModal({
      title: t('event.cancel.title'),
      confirmText: t('event.cancel.modalBtnTxt'),
      cancelText: t('event.cancel.modalCancelBtnTxt'),
      onConfirm: () => mutate(),
    });
  };

  return (
    <div className={styles.buttonsContainer}>
      {status === ParkEventStatus.CANCELED ? (
        <span className={styles.text}>{t('event.organizer.cancelled')}</span>
      ) : isEventEnded ? (
        <span className={styles.text}>{t('event.organizer.ended')}</span>
      ) : (
        <Button variant="secondary" onClick={handleOpenConfirmModal}>
          {t('event.cancel.buttonTxt')}
        </Button>
      )}
    </div>
  );
};

export { OrganizerActions };
