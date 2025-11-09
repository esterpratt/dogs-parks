import { ParkEventInviteeStatus } from '../../types/parkEvent';
import styles from './InviteeActions.module.scss';
import { Button } from '../Button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchInvitee, updateInvitee } from '../../services/events';
import { useState } from 'react';
import { TopModal } from '../modals/TopModal';
import { useTranslation } from 'react-i18next';
import { queryClient } from '../../services/react-query';
import { useNotification } from '../../context/NotificationContext';
import { Loader } from '../Loader';

interface InviteeActionsProps {
  eventId: string;
  userId: string;
}

const InviteeActions: React.FC<InviteeActionsProps> = (
  props: InviteeActionsProps
) => {
  const { eventId, userId } = props;
  const [isDeclineInviteModalOpen, setIsDeclineInviteModalOpen] =
    useState(false);
  const { t } = useTranslation();
  const { notify } = useNotification();

  const { data: invitee, isLoading } = useQuery({
    queryKey: ['event-invitee', userId],
    queryFn: () => fetchInvitee({ userId, eventId }),
  });

  const { mutate: acceptInvite, isPending: isPendingAccept } = useMutation({
    mutationFn: () =>
      updateInvitee({
        userId,
        eventId,
        status: ParkEventInviteeStatus.ACCEPTED,
      }),
    onError: () => {
      notify(t('event.invitee.accept.error'), true);
    },
    onSuccess: () => {
      notify(t('event.invitee.accept.success'));
      queryClient.invalidateQueries({
        queryKey: ['event-invitee', userId],
      });
    },
  });

  const { mutate: declineInvite, isPending: isPendingDecline } = useMutation({
    mutationFn: () =>
      updateInvitee({
        userId,
        eventId,
        status: ParkEventInviteeStatus.DECLINED,
      }),
    onError: () => {
      notify(t('event.invitee.decline.error'), true);
    },
    onSuccess: () => {
      notify(t('event.invitee.decline.success'));
      queryClient.invalidateQueries({
        queryKey: ['event-invitee', userId],
      });
    },
    onSettled: () => {
      setIsDeclineInviteModalOpen(false);
    },
  });

  const isInvited = invitee?.status === ParkEventInviteeStatus.INVITED;
  const isDeclined = invitee?.status === ParkEventInviteeStatus.DECLINED;
  const isRemoved = invitee?.status === ParkEventInviteeStatus.REMOVED;

  if (isRemoved || isDeclined) {
    return null;
  }

  const handleAcceptInvite = () => {
    acceptInvite();
  };

  const handleDeclineInvite = () => {
    declineInvite();
  };

  return (
    <>
      <div className={styles.container}>
        {isInvited && (
          <Button disabled={isLoading} onClick={handleAcceptInvite}>
            {t('common.actions.accept')}
          </Button>
        )}
        <Button
          disabled={isLoading || isPendingAccept}
          variant="secondary"
          onClick={() => setIsDeclineInviteModalOpen(true)}
        >
          {isPendingAccept ? (
            <Loader variant="secondary" inside className={styles.loader} />
          ) : (
            <span>{t('common.actions.decline')}</span>
          )}
        </Button>
      </div>
      <TopModal
        open={isDeclineInviteModalOpen}
        onClose={() => setIsDeclineInviteModalOpen(false)}
      >
        <div className={styles.declineModal}>
          <div>
            <span>{t('event.invitee.decline.title')}</span>
          </div>
        </div>
        <div className={styles.buttonsContainer}>
          <Button
            variant="primary"
            onClick={handleDeclineInvite}
            className={styles.modalButton}
            disabled={isPendingDecline}
          >
            {isPendingDecline ? (
              <Loader variant="secondary" inside className={styles.loader} />
            ) : (
              <span>{t('event.invitee.decline.button')}</span>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsDeclineInviteModalOpen(false)}
            className={styles.modalButton}
            disabled={isPendingDecline}
          >
            <span>{t('common.actions.cancel')}</span>
          </Button>
        </div>
      </TopModal>
    </>
  );
};

export { InviteeActions };
