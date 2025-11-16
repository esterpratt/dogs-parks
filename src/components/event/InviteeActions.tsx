import { ParkEventInviteeStatus } from '../../types/parkEvent';
import { Button } from '../Button';
import { useQuery } from '@tanstack/react-query';
import { fetchInvitee } from '../../services/events';
import { useTranslation } from 'react-i18next';
import { Loader } from '../Loader';
import { useUpdateInvitee } from '../../hooks/api/useUpdateInvitee';
import styles from './InviteeActions.module.scss';
import { useConfirm } from '../../context/ConfirmModalContext';

interface InviteeActionsProps {
  eventId: string;
  userId: string;
}

const InviteeActions: React.FC<InviteeActionsProps> = (
  props: InviteeActionsProps
) => {
  const { eventId, userId } = props;
  const { t } = useTranslation();
  const { showModal } = useConfirm();

  const { data: invitee, isLoading } = useQuery({
    queryKey: ['event-invitee', userId],
    queryFn: () => fetchInvitee({ userId, eventId }),
  });

  const { handleUpdateInvitee, isPendingAccept } = useUpdateInvitee({
    userId,
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

  const isInvited = invitee?.status === ParkEventInviteeStatus.INVITED;
  const isDeclined = invitee?.status === ParkEventInviteeStatus.DECLINED;
  const isRemoved = invitee?.status === ParkEventInviteeStatus.REMOVED;

  if (isRemoved || isDeclined) {
    return null;
  }

  return (
    <>
      <div className={styles.container}>
        {isInvited && (
          <Button
            disabled={isLoading || isPendingAccept}
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
              <span>{t('common.actions.accept')}</span>
            )}
          </Button>
        )}
        <Button
          disabled={isLoading || isPendingAccept}
          variant="secondary"
          onClick={handleOpenConfirmModal}
        >
          <span>{t('common.actions.decline')}</span>
        </Button>
      </div>
    </>
  );
};

export { InviteeActions };
