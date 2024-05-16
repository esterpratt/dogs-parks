import { useContext } from 'react';
import { UserFriendsContext } from '../context/UserFriendsContext';
import { FRIENDSHIP_STATUS } from '../types/friendship';
import { User } from '../types/user';

interface GetFriendshipStatusProps {
  friendId: string;
  friends: User[];
  pendingFriends: User[];
  myPendingFriends: User[];
}

const getButtonProps = (
  friendshipData: {
    status: FRIENDSHIP_STATUS;
    isFriendIsRequester?: boolean;
  } | null
) => {
  if (!friendshipData) {
    return {
      buttonText: 'Add Friend',
      statusToUpdate: FRIENDSHIP_STATUS.PENDING,
    };
  }

  const { status, isFriendIsRequester } = friendshipData;

  switch (status) {
    case FRIENDSHIP_STATUS.APPROVED: {
      return {
        buttonText: 'Unfriend',
        statusToUpdate: FRIENDSHIP_STATUS.REMOVED,
      };
    }
    case FRIENDSHIP_STATUS.PENDING: {
      if (isFriendIsRequester) {
        return {
          buttonText: 'Approve Friend Request',
          statusToUpdate: FRIENDSHIP_STATUS.APPROVED,
        };
      } else {
        return {
          buttonText: 'Remove Friend Request',
          statusToUpdate: FRIENDSHIP_STATUS.ABORTED,
        };
      }
    }
    default: {
      return {
        buttonText: 'Add friend',
        statusToUpdate: FRIENDSHIP_STATUS.PENDING,
      };
    }
  }
};

const getFriendshipStatus = ({
  friendId,
  friends,
  pendingFriends,
  myPendingFriends,
}: GetFriendshipStatusProps) => {
  if (friends.find((friend) => friend.id === friendId)) {
    return {
      status: FRIENDSHIP_STATUS.APPROVED,
    };
  }

  if (pendingFriends.find((friend) => friend.id === friendId)) {
    return {
      status: FRIENDSHIP_STATUS.PENDING,
      isFriendIsRequester: true,
    };
  }

  if (myPendingFriends.find((friend) => friend.id === friendId)) {
    return {
      status: FRIENDSHIP_STATUS.PENDING,
      isFriendIsRequester: false,
    };
  }

  return null;
};

const useFriendshipStatus = (userId: string) => {
  const { friends, pendingFriends, myPendingFriends } =
    useContext(UserFriendsContext);

  const { statusToUpdate, buttonText } = getButtonProps(
    getFriendshipStatus({
      friendId: userId,
      friends,
      pendingFriends,
      myPendingFriends,
    })
  );

  return { statusToUpdate, buttonText };
};

export { useFriendshipStatus };
