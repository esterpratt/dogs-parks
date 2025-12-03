import { ParkEventInviteeStatus, ParkEventStatus } from '../../types/parkEvent';
import { Button } from '../Button';
import { useTranslation } from 'react-i18next';
import { Loader } from '../Loader';
import { useUpdateInvitee } from '../../hooks/api/useUpdateInvitee';
import { useConfirm } from '../../context/ConfirmModalContext';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCallback } from 'react';
import styles from './InviteeActions.module.scss';

interface InviteeActionsProps {
  eventStatus: ParkEventStatus;
  inviteeStatus: ParkEventInviteeStatus;
  eventId: string;
  userId: string;
}

const InviteeActions: React.FC<InviteeActionsProps> = (
  props: InviteeActionsProps
) => {
  const { eventId, userId, inviteeStatus, eventStatus } = props;
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
  const isDeclined = inviteeStatus === ParkEventInviteeStatus.DECLINED;
  const isRemoved = inviteeStatus === ParkEventInviteeStatus.REMOVED;
  const isCancelled = eventStatus === ParkEventStatus.CANCELED;

  if (isRemoved || isDeclined || isCancelled) {
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

  return (
    <div className={styles.container}>
      {isInvited && (
        <Button
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
