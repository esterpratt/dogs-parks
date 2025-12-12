import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCallback } from 'react';
import { ParkEventInviteeStatus, ParkEventStatus } from '../../types/parkEvent';
import { useUpdateInvitee } from '../../hooks/api/useUpdateInvitee';
import { useConfirm } from '../../context/ConfirmModalContext';
import { Button } from '../Button';
import { Loader } from '../Loader';
import styles from './InviteeActions.module.scss';

interface InviteeActionsProps {
  eventStatus: ParkEventStatus;
  inviteeStatus: ParkEventInviteeStatus;
  eventId: string;
  userId: string;
  isEventEnded?: boolean;
}

const InviteeActions: React.FC<InviteeActionsProps> = (
  props: InviteeActionsProps
) => {
  const { eventId, userId, inviteeStatus, eventStatus, isEventEnded } = props;
  const { t } = useTranslation();
  const { showModal } = useConfirm();
  const navigate = useNavigate();

  const onSettledDecline = useCallback(() => {
    navigate(`/profile/${userId}/events`);
  }, [userId, navigate]);

  const { handleUpdateInvitee, isPendingAccept } = useUpdateInvitee({
    eventId,
    userId,
    onSettledDecline,
  });

  const handleOpenConfirmModal = () => {
    showModal({
      title: t('event.invitee.decline.title'),
      confirmText: t('event.invitee.decline.button'),
      onConfirm: () =>
        handleUpdateInvitee({
          eventId,
          status: ParkEventInviteeStatus.DECLINED,
        }),
    });
  };

  const isInvited = inviteeStatus === ParkEventInviteeStatus.INVITED;
  const isAccepted = inviteeStatus === ParkEventInviteeStatus.ACCEPTED;
  const isDeclined = inviteeStatus === ParkEventInviteeStatus.DECLINED;
  const isRemoved = inviteeStatus === ParkEventInviteeStatus.REMOVED;
  const isCancelled = eventStatus === ParkEventStatus.CANCELED;

  if (isCancelled || isDeclined || isRemoved) {
    return (
      <div className={styles.container}>
        <span className={styles.text}>
          {t(
            `event.invitee.${isCancelled ? 'cancelled' : isDeclined ? 'declined' : 'removed'}`
          )}
        </span>
      </div>
    );
  }

  if (isEventEnded && (isInvited || isAccepted)) {
    return (
      <div className={styles.container}>
        <span className={styles.text}>{t('event.invitee.ended')}</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {isInvited && (
        <Button
          className={styles.button}
          disabled={isPendingAccept}
          onClick={() =>
            handleUpdateInvitee({
              eventId,
              status: ParkEventInviteeStatus.ACCEPTED,
            })
          }
        >
          {isPendingAccept ? (
            <Loader variant="secondary" inside className={styles.loader} />
          ) : (
            <>
              <Check size={14} />
              <span>{t('common.actions.accept')}</span>
            </>
          )}
        </Button>
      )}
      <Button
        className={styles.button}
        disabled={isPendingAccept}
        variant="secondary"
        onClick={handleOpenConfirmModal}
      >
        <X size={14} />
        <span>{t('common.actions.decline')}</span>
      </Button>
    </div>
  );
};

export { InviteeActions };
