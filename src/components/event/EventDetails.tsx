import { useContext, useState } from 'react';
import { useDateUtils } from '../../hooks/useDateUtils';
import { Invitee, ParkEvent, ParkEventStatus } from '../../types/parkEvent';
import styles from './EventDetails.module.scss';
import { UserContext } from '../../context/UserContext';
import { Button } from '../Button';
import { InviteeActions } from './InviteeActions';
import { useMutation } from '@tanstack/react-query';
import { TopModal } from '../modals/TopModal';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation } from 'react-i18next';
import { cancelEvent } from '../../services/events';
import { useNavigate } from 'react-router';
import { queryClient } from '../../services/react-query';
import { Loader } from '../Loader';
import { InviteesList } from './InviteesList';

interface EventDetailsProps {
  event: ParkEvent;
  invitees: Invitee[];
  parkName: string;
}

const EventDetails: React.FC<EventDetailsProps> = (
  props: EventDetailsProps
) => {
  const { event, invitees, parkName } = props;
  const {
    start_at: startAt,
    creator_name,
    creator_id,
    message,
    status,
  } = event;

  const { userId } = useContext(UserContext);
  const [isCancelEventModalOpen, setIsCancelEventModalOpen] = useState(false);
  const { t } = useTranslation();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { formatFutureCalendar } = useDateUtils();

  const startTime = formatFutureCalendar(startAt);
  const userIsOrganizer = userId && userId === creator_id;

  const { mutate, isPending } = useMutation({
    mutationFn: () => cancelEvent(event.id),
    onError: () => {
      notify(t('event.cancel.error'), true);
    },
    onSuccess: () => {
      notify(t('event.cancel.success'));
      queryClient.invalidateQueries({
        queryKey: ['events', 'organized', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['event', event.id],
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

  const otherInvitees = invitees.filter(
    (invitee) => invitee.user_id !== userId
  );

  return (
    <>
      <div className={styles.container}>
        <div>Location: {parkName}</div>
        <div>When: {startTime}</div>
        <div>Organized by {userIsOrganizer ? 'me' : creator_name}</div>
        <div>
          <InviteesList invitees={otherInvitees} userId={userId} />
          {userIsOrganizer && <>Invite more friends</>}
        </div>
        <div>
          <span>More details:</span>
          <span>{message}</span>
        </div>
        {userIsOrganizer ? (
          status !== ParkEventStatus.CANCELED ? (
            <Button onClick={() => setIsCancelEventModalOpen(true)}>
              Cancel event
            </Button>
          ) : null
        ) : (
          <InviteeActions eventId={event.id} userId={userId!} />
        )}
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
              <>
                <span>{t('event.cancel.button')}</span>
              </>
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

export { EventDetails };
