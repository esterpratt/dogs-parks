import { useEffect, useState } from 'react';
import { Friendship, FRIENDSHIP_STATUS } from '../../types/friendship';
import {
  createFriendship,
  deleteFriendship,
  fetchFriendship,
  updateFriendship,
} from '../../services/friendships';

interface PublicProfileProps {
  signedInUserId: string;
  userId: string;
}

const FriendRequestButton: React.FC<PublicProfileProps> = ({
  signedInUserId,
  userId,
}) => {
  const [friendship, setFriendShip] = useState<Friendship | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFriendRequest = async () => {
      const friendRequest = await fetchFriendship([signedInUserId, userId]);
      if (friendRequest) {
        setFriendShip(friendRequest);
      }
      setLoading(false);
    };

    getFriendRequest();
  }, [signedInUserId, userId]);

  const { statusToUpdate, buttonText } = getButtonProps(
    signedInUserId,
    friendship
  );

  const onUpdateFriend = async () => {
    if (!friendship) {
      const friendshipId = await createFriendship({
        requesterId: signedInUserId,
        requesteeId: userId,
      });
      // right now I return null if there is an error
      if (friendshipId) {
        setFriendShip({
          id: friendshipId,
          requesterId: signedInUserId,
          requesteeId: userId,
          status: FRIENDSHIP_STATUS.PENDING,
        });
      }
    } else if (statusToUpdate === FRIENDSHIP_STATUS.REMOVED) {
      await deleteFriendship(friendship.id);
      setFriendShip(null);
    } else {
      const res = await updateFriendship({
        friendshipId: friendship!.id,
        status: statusToUpdate,
      });
      // right now I return null if there is an error
      if (res) {
        // stupid typescript - prev can't be null but nevertheless it creates issues
        setFriendShip((prev) => {
          if (prev) {
            return {
              ...prev,
              status: statusToUpdate,
            };
          }
          return null;
        });
      }
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div>
      <button onClick={onUpdateFriend}>{buttonText}</button>
    </div>
  );
};

const getButtonProps = (
  signedInUserId: string,
  friendship: Friendship | null
) => {
  if (!friendship) {
    return {
      buttonText: 'Add Friend',
      statusToUpdate: FRIENDSHIP_STATUS.PENDING,
    };
  }

  const isSignedInUserIsRequester = signedInUserId === friendship.requesterId;

  switch (friendship.status) {
    case FRIENDSHIP_STATUS.PENDING: {
      if (isSignedInUserIsRequester) {
        return {
          buttonText: 'Remove Friend Request',
          statusToUpdate: FRIENDSHIP_STATUS.ABORTED,
        };
      } else {
        return {
          buttonText: 'Approve Friend Request',
          statusToUpdate: FRIENDSHIP_STATUS.APPROVED,
        };
      }
    }
    case FRIENDSHIP_STATUS.APPROVED: {
      return {
        buttonText: 'Unfriend',
        statusToUpdate: FRIENDSHIP_STATUS.REMOVED,
      };
    }
    case FRIENDSHIP_STATUS.ABORTED: {
      return {
        buttonText: 'Add friend',
        statusToUpdate: FRIENDSHIP_STATUS.PENDING,
      };
    }
    default: {
      return {
        buttonText: 'Add friend',
        statusToUpdate: FRIENDSHIP_STATUS.PENDING,
      };
    }
  }
};

export { FriendRequestButton };
