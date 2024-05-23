import { useQuery } from '@tanstack/react-query';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../types/friendship';
import { useGetFriendIds } from './useGetFriendIds';
import { fetchUsers } from '../services/users';

const useGetUserFriends = (userId: string) => {
  const { friendIds = [], isPendingFriendIds } = useGetFriendIds({
    userId,
  });

  const {
    friendIds: pendingFriendIds = [],
    isPendingFriendIds: isPendingPendingFriendIds,
  } = useGetFriendIds({
    userId,
    userRole: USER_ROLE.REQUESTEE,
    friendshipStatus: FRIENDSHIP_STATUS.PENDING,
    additionalKey: 'pendingFriends',
  });

  const {
    friendIds: myPendingFriendIds = [],
    isPendingFriendIds: isPendingMyPendingFriendIds,
  } = useGetFriendIds({
    userId,
    userRole: USER_ROLE.REQUESTER,
    friendshipStatus: FRIENDSHIP_STATUS.PENDING,
    additionalKey: 'myPendingFriends',
  });

  const isPendingIds =
    isPendingFriendIds ||
    isPendingPendingFriendIds ||
    isPendingMyPendingFriendIds;

  const { data: friends = [], isPending: isPendingFriends } = useQuery({
    queryKey: ['friends', userId, 'approved', 'users'],
    queryFn: () => fetchUsers(friendIds),
    enabled: !!friendIds.length,
  });

  const { data: pendingFriends = [], isPending: isPendingPendingFriends } =
    useQuery({
      queryKey: ['friends', userId, 'pendingFriends', 'users'],
      queryFn: () => fetchUsers(pendingFriendIds),
      enabled: !!pendingFriendIds.length,
    });

  const { data: myPendingFriends = [], isPending: isPendingMyPendingFriends } =
    useQuery({
      queryKey: ['friends', userId, 'myPendingFriends', 'users'],
      queryFn: () => fetchUsers(myPendingFriendIds),
      enabled: !!myPendingFriendIds.length,
    });

  const isPendingUsers =
    isPendingFriends || isPendingPendingFriends || isPendingMyPendingFriends;

  return {
    isPendingIds,
    isPendingUsers,
    friendIds,
    pendingFriendIds,
    myPendingFriendIds,
    friends,
    pendingFriends,
    myPendingFriends,
  };
};

export { useGetUserFriends };
