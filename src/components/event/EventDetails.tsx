import { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateUtils } from '../../hooks/useDateUtils';
import { useFetchFriends } from '../../hooks/api/useFetchFriends';
import { User } from '../../types/user';
import { Invitee, ParkEvent, ParkEventStatus } from '../../types/parkEvent';
import { UserContext } from '../../context/UserContext';
import { InviteeActions } from './InviteeActions';
import { InviteesList } from './InviteesList';
import { SelectUsers } from '../SelectUsers';
import { OrganizerActions } from './OrganizerActions';
import styles from './EventDetails.module.scss';
import { useMutation } from '@tanstack/react-query';
import { useNotification } from '../../context/NotificationContext';
import { queryClient } from '../../services/react-query';
import { useNavigate } from 'react-router';
import { addEventInvitees } from '../../services/events';

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

  const [addedFriends, setAddedFriends] = useState<User[]>([]);
  const { friends } = useFetchFriends({ userId });

  const { t } = useTranslation();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const { formatFutureCalendar } = useDateUtils();

  const startTime = formatFutureCalendar(startAt);
  const userIsOrganizer = userId && userId === creator_id;

  const { otherInvitees, otherInviteesSet } = useMemo(() => {
    const usersInvited = invitees.filter(
      (invitee) => invitee.user_id !== userId
    );
    const usersInviteesSet = new Set(
      usersInvited.map((invitee) => invitee.user_id)
    );
    return { otherInvitees: usersInvited, otherInviteesSet: usersInviteesSet };
  }, [invitees, userId]);

  const notInvitedFriends = useMemo(() => {
    return friends?.filter((friend) => !otherInviteesSet.has(friend.id));
  }, [friends, otherInviteesSet]);

  const { mutate: saveAddedFriends, isPending: isPendingAddFriends } =
    useMutation({
      mutationFn: () =>
        addEventInvitees({
          eventId: event.id,
          inviteeIds: addedFriends.map((friend) => friend.id),
        }),
      onError: () => {
        notify(t('event.save.error'), true);
      },
      onSuccess: () => {
        notify(t('event.save.success'));
        queryClient.invalidateQueries({
          queryKey: ['events', 'organized', userId],
        });
        queryClient.invalidateQueries({
          queryKey: ['event', event.id],
        });
        navigate(`/profile/${userId}/events`);
      },
    });

  const handleSaveEvent = () => {
    saveAddedFriends();
  };

  return (
    <>
      <div className={styles.container}>
        <div>Location: {parkName}</div>
        <div>When: {startTime}</div>
        <div>Organized by {userIsOrganizer ? 'me' : creator_name}</div>
        <div>
          <InviteesList invitees={otherInvitees} userId={userId} />
          {userIsOrganizer && !!notInvitedFriends?.length && (
            <SelectUsers
              label={t('event.addFriends')}
              users={notInvitedFriends}
              selectedUsers={addedFriends}
              setSelectedUsers={setAddedFriends}
            />
          )}
        </div>
        <div>
          <span>More details:</span>
          <span>{message}</span>
        </div>
        {userIsOrganizer ? (
          status !== ParkEventStatus.CANCELED ? (
            <OrganizerActions
              showSaveButton={!!notInvitedFriends?.length}
              isPendingSave={isPendingAddFriends}
              disableSaveButton={!addedFriends.length}
              userId={userId}
              eventId={event.id}
              onSaveEvent={handleSaveEvent}
            />
          ) : null
        ) : (
          <InviteeActions eventId={event.id} userId={userId!} />
        )}
      </div>
    </>
  );
};

export { EventDetails };
