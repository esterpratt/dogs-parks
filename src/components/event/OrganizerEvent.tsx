import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../services/react-query';
import { addEventInvitees } from '../../services/events';
import { useFetchFriends } from '../../hooks/api/useFetchFriends';
import { User } from '../../types/user';
import {
  Invitee,
  ParkEvent,
  ParkEventInviteeStatus,
  ParkEventStatus,
} from '../../types/parkEvent';
import { useNotification } from '../../context/NotificationContext';
import { SelectUsers } from '../SelectUsers';
import { OrganizerActions } from './OrganizerActions';
import { EventHeader } from './EventHeader';
import { EventBody } from './EventBody';
import { EventDetails } from './EventDetails';

interface OrganizerEventProps {
  event: ParkEvent;
  invitees: Invitee[];
  parkName: string;
  parkImage: string;
  userId: string;
}

const OrganizerEvent = (props: OrganizerEventProps) => {
  const { event, invitees, parkName, parkImage, userId } = props;
  const { status, start_at, message } = event;

  const [addedFriends, setAddedFriends] = useState<User[]>([]);
  const { friends } = useFetchFriends({ userId });

  const { t } = useTranslation();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const { invitedFriends, goingFriends, notInvitedFriends } = useMemo(() => {
    const invitedFriends: User[] = [];
    const goingFriends: User[] = [];
    const notInvitedFriends: User[] = [];

    if (!friends) {
      return { invitedFriends, goingFriends, notInvitedFriends };
    }

    const invitedUsersMap = new Map<string, Invitee>();
    for (const invitee of invitees) {
      invitedUsersMap.set(invitee.user_id, invitee);
    }

    friends?.forEach((friend) => {
      const invitedFriend = invitedUsersMap.get(friend.id);
      if (invitedFriend) {
        if (invitedFriend.status === ParkEventInviteeStatus.ACCEPTED) {
          goingFriends.push(friend);
        } else if (invitedFriend!.status === ParkEventInviteeStatus.INVITED) {
          invitedFriends.push(friend);
        }
      } else {
        notInvitedFriends.push(friend);
      }
    });
    return {
      invitedFriends,
      goingFriends,
      notInvitedFriends,
    };
  }, [invitees, friends]);

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
    <EventDetails
      eventHeader={
        <EventHeader
          startAt={start_at}
          parkName={parkName}
          parkImage={parkImage}
          userId={userId}
        />
      }
      eventBody={
        <EventBody
          organizedBy={t('event.organizedBy', { name: 'me' })}
          friendsSelection={
            !!notInvitedFriends?.length && (
              <SelectUsers
                label={t('event.addFriends')}
                users={notInvitedFriends}
                selectedUsers={addedFriends}
                setSelectedUsers={setAddedFriends}
              />
            )
          }
          message={message}
          invitedFriends={invitedFriends}
          goingFriends={goingFriends}
        />
      }
      eventActions={
        status !== ParkEventStatus.CANCELED && (
          <OrganizerActions
            showSaveButton={!!notInvitedFriends?.length}
            isPendingSave={isPendingAddFriends}
            disableSaveButton={!addedFriends.length}
            userId={userId}
            eventId={event.id}
            onSaveEvent={handleSaveEvent}
          />
        )
      }
    />
  );
};

export { OrganizerEvent };
