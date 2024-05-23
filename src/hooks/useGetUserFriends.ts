import { useQuery } from '@tanstack/react-query';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import { useGetFriendIds } from './useGetFriendIds';
import { fetchUsers } from '../services/users';

const useGetUserFriends = (userId: string) => {
  const { friendIds = [], isLoadingFriendIds } = useGetFriendIds({
    userId,
  });

  const {
    friendIds: pendingFriendIds = [],
    isLoadingFriendIds: isLoadingPendingFriendIds,
  } = useGetFriendIds({
    userId,
    userRole: USER_ROLE.REQUESTEE,
    friendshipStatus: FRIENDSHIP_STATUS.PENDING,
    additionalKey: 'pendingFriends',
  });

  const {
    friendIds: myPendingFriendIds = [],
    isLoadingFriendIds: isLoadingMyPendingFriendIds,
  } = useGetFriendIds({
    userId,
    userRole: USER_ROLE.REQUESTER,
    friendshipStatus: FRIENDSHIP_STATUS.PENDING,
    additionalKey: 'myPendingFriends',
  });

  const isLoadingIds =
    isLoadingFriendIds ||
    isLoadingPendingFriendIds ||
    isLoadingMyPendingFriendIds;

  const { data: friends = [], isLoading: isLoadingFriends } = useQuery({
    queryKey: ['friends', userId, 'approved', 'users'],
    queryFn: () => fetchUsers(friendIds),
    enabled: !!friendIds.length,
  });

  const { data: pendingFriends = [], isLoading: isLoadingPendingFriends } =
    useQuery({
      queryKey: ['friends', userId, 'pendingFriends', 'users'],
      queryFn: () => fetchUsers(pendingFriendIds),
      enabled: !!pendingFriendIds.length,
    });

  const { data: myPendingFriends = [], isLoading: isLoadingMyPendingFriends } =
    useQuery({
      queryKey: ['friends', userId, 'myPendingFriends', 'users'],
      queryFn: () => fetchUsers(myPendingFriendIds),
      enabled: !!myPendingFriendIds.length,
    });

  const isLoadingUsers =
    isLoadingFriends || isLoadingPendingFriends || isLoadingMyPendingFriends;

  return {
    isLoadingIds,
    isLoadingUsers,
    friendIds,
    pendingFriendIds,
    myPendingFriendIds,
    friends,
    pendingFriends,
    myPendingFriends,
  };
};

export { useGetUserFriends };
