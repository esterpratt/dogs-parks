import { FRIENDSHIP_STATUS } from '../../types/friendship';
import { useGetUserFriendsIds } from './useGetUserFriendsIds';

interface GetFriendshipStatusProps {
  friendId: string;
  friendsIds: string[];
  pendingFriendsIds: string[];
  myPendingFriendsIds: string[];
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
  friendsIds,
  pendingFriendsIds,
  myPendingFriendsIds,
}: GetFriendshipStatusProps) => {
  if (friendsIds.includes(friendId)) {
    return {
      status: FRIENDSHIP_STATUS.APPROVED,
    };
  }

  if (pendingFriendsIds.includes(friendId)) {
    return {
      status: FRIENDSHIP_STATUS.PENDING,
      isFriendIsRequester: true,
    };
  }

  if (myPendingFriendsIds.includes(friendId)) {
    return {
      status: FRIENDSHIP_STATUS.PENDING,
      isFriendIsRequester: false,
    };
  }

  return null;
};

const useFriendshipStatus = ({
  userId,
  friendId,
}: {
  userId: string;
  friendId: string;
}) => {
  const { friendsIds, pendingFriendsIds, myPendingFriendsIds, isLoading } =
    useGetUserFriendsIds(userId);

  const { statusToUpdate, buttonText } = getButtonProps(
    getFriendshipStatus({
      friendId,
      friendsIds,
      pendingFriendsIds,
      myPendingFriendsIds,
    })
  );

  return { statusToUpdate, buttonText, isLoading };
};

export { useFriendshipStatus };
