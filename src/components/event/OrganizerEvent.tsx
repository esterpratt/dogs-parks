import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetchFriends } from '../../hooks/api/useFetchFriends';
import { User } from '../../types/user';
import {
  Invitee,
  ParkEvent,
  ParkEventInviteeStatus,
  ParkEventStatus,
} from '../../types/parkEvent';
import { OrganizerActions } from './OrganizerActions';
import { EventHeader } from './EventHeader';
import { EventBody } from './EventBody';
import { EventDetails } from './EventDetails';
import { AddFriendsModal } from './AddFriendsModal';

interface OrganizerEventProps {
  event: ParkEvent;
  invitees: Invitee[];
  parkName: string;
  parkImage: string;
  userId: string;
}

const OrganizerEvent = (props: OrganizerEventProps) => {
  const { event, invitees, parkName, parkImage, userId } = props;
  const { status, start_at, end_at, message } = event;
  const { friends, isLoadingFriends, isLoadingFriendshipMap } = useFetchFriends(
    { userId }
  );

  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);

  const { t } = useTranslation();

  const isEventEnded = !!end_at && new Date() > new Date(end_at);

  const { invitedFriends, goingFriends, notGoingFriends, notInvitedFriends } =
    useMemo(() => {
      const invitedFriends: User[] = [];
      const goingFriends: User[] = [];
      const notGoingFriends: User[] = [];
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
          } else if (
            invitedFriend!.status === ParkEventInviteeStatus.DECLINED
          ) {
            notGoingFriends.push(friend);
          }
        } else {
          notInvitedFriends.push(friend);
        }
      });

      return {
        invitedFriends,
        goingFriends,
        notGoingFriends,
        notInvitedFriends,
      };
    }, [invitees, friends]);

  return (
    <>
      <EventDetails
        eventHeader={
          <EventHeader
            title={t('event.title.yours')}
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
            messageTitle={t('event.message.organizerTitle')}
            message={message}
            invitedFriends={invitedFriends}
            goingFriends={goingFriends}
            notGoingFriends={notGoingFriends}
            isLoadingFriends={isLoadingFriends || isLoadingFriendshipMap}
            onClickFriendsAddition={
              notInvitedFriends?.length &&
              status !== ParkEventStatus.CANCELED &&
              !isEventEnded
                ? () => setIsFriendsModalOpen(true)
                : null
            }
          />
        }
        eventActions={
          <OrganizerActions
            userId={userId}
            eventId={event.id}
            status={status}
            isEventEnded={isEventEnded}
          />
        }
      />
      {!!notInvitedFriends?.length && (
        <AddFriendsModal
          onClose={() => setIsFriendsModalOpen(false)}
          open={isFriendsModalOpen}
          notInvitedFriends={notInvitedFriends}
          eventId={event.id}
          userId={userId}
        />
      )}
    </>
  );
};

export { OrganizerEvent };
