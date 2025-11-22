import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetchFriends } from '../../hooks/api/useFetchFriends';
import { User } from '../../types/user';
import {
  Invitee,
  ParkEvent,
  ParkEventInviteeStatus,
} from '../../types/parkEvent';
import { EventHeader } from './EventHeader';
import { EventBody } from './EventBody';
import { EventDetails } from './EventDetails';
import { InviteeActions } from './InviteeActions';

interface InviteeEventProps {
  event: ParkEvent;
  invitees: Invitee[];
  parkName: string;
  parkImage: string;
  userId: string;
}

const InvitedEvent = (props: InviteeEventProps) => {
  const { event, invitees, parkName, parkImage, userId } = props;
  const { start_at, creator_name, message } = event;

  const { friends } = useFetchFriends({ userId });

  const { t } = useTranslation();

  const userInvitationStatus = invitees.find(
    (invitee) => invitee.user_id === userId
  )?.status;

  const { invitedFriends, goingFriends } = useMemo(() => {
    const invitedFriends: User[] = [];
    const goingFriends: User[] = [];

    if (!friends) {
      return { invitedFriends, goingFriends };
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
      }
    });
    return {
      invitedFriends,
      goingFriends,
    };
  }, [invitees, friends]);

  return (
    <EventDetails
      eventHeader={
        <EventHeader
          title={
            userInvitationStatus === ParkEventInviteeStatus.ACCEPTED
              ? t('event.title.going')
              : userInvitationStatus === ParkEventInviteeStatus.INVITED
                ? t('event.title.invited')
                : null
          }
          parkName={parkName}
          parkImage={parkImage}
          userId={userId}
        />
      }
      eventBody={
        <EventBody
          startAt={start_at}
          organizedBy={t('event.organizedBy', { name: creator_name })}
          message={message}
          invitedFriends={invitedFriends}
          goingFriends={goingFriends}
        />
      }
      eventActions={<InviteeActions eventId={event.id} userId={userId!} />}
    />
  );
};

export { InvitedEvent };
