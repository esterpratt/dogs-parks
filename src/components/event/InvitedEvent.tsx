import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useFetchFriends } from '../../hooks/api/useFetchFriends';
import { User } from '../../types/user';
import {
  Invitee,
  ParkEvent,
  ParkEventInviteeStatus,
  ParkEventStatus,
} from '../../types/parkEvent';
import { fetchInvitee } from '../../services/events';
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
  const { start_at, end_at, creator_name, message } = event;

  const { friends, isLoadingFriends, isLoadingFriendshipMap } = useFetchFriends(
    { userId }
  );

  const { t } = useTranslation();

  const { data: invitee, isLoading: isLoadingInvitee } = useQuery({
    queryKey: ['event-invitee', event.id, userId],
    queryFn: () => fetchInvitee({ userId, eventId: event.id }),
  });

  const inviteeStatus = invitee?.status;
  const isEventEnded = !!end_at && new Date() > new Date(end_at);

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
            event.status === ParkEventStatus.CANCELED
              ? t('event.title.cancelled')
              : inviteeStatus === ParkEventInviteeStatus.ACCEPTED
                ? isEventEnded
                  ? t('event.title.wentTo')
                  : t('event.title.going')
                : inviteeStatus === ParkEventInviteeStatus.INVITED
                  ? isEventEnded
                    ? t('event.title.wereInvited')
                    : t('event.title.invited')
                  : null
          }
          parkName={parkName}
          parkImage={parkImage}
          parkId={event.park_id}
          userId={userId}
        />
      }
      eventBody={
        <EventBody
          startAt={start_at}
          isEventEnded={isEventEnded}
          organizedBy={creator_name}
          message={message}
          messageTitle={t('event.message.title')}
          invitedFriends={invitedFriends}
          goingFriends={goingFriends}
          isLoadingFriends={isLoadingFriends || isLoadingFriendshipMap}
        />
      }
      eventActions={
        !isLoadingInvitee && (
          <InviteeActions
            eventStatus={event.status}
            inviteeStatus={inviteeStatus}
            eventId={event.id}
            userId={userId!}
            isEventEnded={isEventEnded}
          />
        )
      }
    />
  );
};

export { InvitedEvent };
