import { useEffect, useState } from 'react';
import { User } from '../../types/user';
import { Friendship, FRIENDSHIP_STATUS } from '../../types/friendship';
import {
  createFriendship,
  fetchFriendship,
  updateFriendship,
} from '../../services/friendships';

interface PublicProfileProps {
  signedInUserId: User['id'];
  userId: User['id'];
}

const FriendRequestButton: React.FC<PublicProfileProps> = ({
  signedInUserId,
  userId,
}) => {
  const [friendship, setFriendShip] = useState<Friendship | null>(null);
  const [loading, setLoading] = useState(true);

  const { statusToUpdate, buttonText } = getButtonProps(
    signedInUserId,
    friendship
  );

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

  const onUpdateFriend = async () => {
    if (!statusToUpdate) {
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
  signedInUserId: User['id'],
  friendship: Friendship | null
) => {
  if (!friendship) {
    return {
      buttonText: 'Add Friend',
      statusToUpdate: null,
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
        statusToUpdate: FRIENDSHIP_STATUS.REJECTED,
      };
    }
    case FRIENDSHIP_STATUS.REJECTED: {
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
