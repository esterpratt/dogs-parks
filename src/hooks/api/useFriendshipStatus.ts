import { FRIENDSHIP_STATUS } from '../../types/friendship';
import { useGetUserFriendsIds } from './useGetUserFriendsIds';

interface GetFriendshipStatusProps {
  friendId: string;
  friendsIds: string[];
  pendingFriendsIds: string[];
  myPendingFriendsIds: string[];
}

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

  const friendshipStatus = 
    getFriendshipStatus({
      friendId,
      friendsIds,
      pendingFriendsIds,
      myPendingFriendsIds,
    })

  return { status: friendshipStatus?.status, isFriendIsRequester: friendshipStatus?.isFriendIsRequester, isLoading };
};

export { useFriendshipStatus };
