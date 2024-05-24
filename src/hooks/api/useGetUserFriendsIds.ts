import { FRIENDSHIP_STATUS, USER_ROLE } from '../../types/friendship';
import { useGetFriendsIds } from './useGetFriendsIds';
import { FRIENDS_KEY } from './keys';

const useGetUserFriendsIds = (userId: string) => {
  const { friendsIds = [], isLoading: isLoadingFriendsIds } = useGetFriendsIds({
    userId,
  });

  const {
    friendsIds: pendingFriendsIds = [],
    isLoading: isLoadingPendingFriendsIds,
  } = useGetFriendsIds({
    userId,
    userRole: USER_ROLE.REQUESTEE,
    friendshipStatus: FRIENDSHIP_STATUS.PENDING,
    additionalKey: FRIENDS_KEY.PENDING_FRIENDS,
  });

  const {
    friendsIds: myPendingFriendsIds = [],
    isLoading: isLoadingMyPendingFriendsIds,
  } = useGetFriendsIds({
    userId,
    userRole: USER_ROLE.REQUESTER,
    friendshipStatus: FRIENDSHIP_STATUS.PENDING,
    additionalKey: FRIENDS_KEY.MY_PENDING_FRIENDS,
  });

  const isLoading =
    isLoadingFriendsIds ||
    isLoadingPendingFriendsIds ||
    isLoadingMyPendingFriendsIds;

  return {
    isLoading,
    friendsIds,
    pendingFriendsIds,
    myPendingFriendsIds,
  };
};

export { useGetUserFriendsIds };
