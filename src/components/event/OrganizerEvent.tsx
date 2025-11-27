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
  const { status, start_at, message } = event;
  const { friends, isLoadingFriends, isLoadingFriendshipMap } = useFetchFriends(
    { userId }
  );

  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);

  const { t } = useTranslation();

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

  return (
    <>
      <EventDetails
        eventHeader={
          <EventHeader
            title={t('event.title.yours')}
            parkName={parkName}
            parkImage={parkImage}
            userId={userId}
          />
        }
        eventBody={
          <EventBody
            startAt={start_at}
            messageTitle={t('event.message.organizerTitle')}
            message={message}
            invitedFriends={invitedFriends}
            goingFriends={goingFriends}
            isLoadingFriends={isLoadingFriends || isLoadingFriendshipMap}
            onClickFriendsAddition={
              notInvitedFriends?.length
                ? () => setIsFriendsModalOpen(true)
                : null
            }
          />
        }
        eventActions={
          status !== ParkEventStatus.CANCELED && (
            <OrganizerActions userId={userId} eventId={event.id} />
          )
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
