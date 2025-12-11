import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../../services/users';
import { FRIENDSHIP_STATUS } from '../../types/friendship';
import { getFriendIdsByStatus } from '../../utils/friendship';
import { useUserFriendshipMap } from './useUserFriendshipMap';

interface UseFetchFriendsParams {
  userId?: string | null;
  status?: FRIENDSHIP_STATUS;
}

const useFetchFriends = (params: UseFetchFriendsParams) => {
  const { userId, status = FRIENDSHIP_STATUS.APPROVED } = params;

  const { data: friendshipMap, isLoading: isLoadingFriendshipMap } =
    useUserFriendshipMap(userId);

  const friendIds = useMemo(
    () =>
      friendshipMap
        ? getFriendIdsByStatus({
            friendshipMap,
            status,
          })
        : [],
    [friendshipMap, status]
  );

  const { data: friends, isLoading: isLoadingFriends } = useQuery({
    queryKey: ['users', friendIds],
    enabled: !!friendIds.length,
    queryFn: () => fetchUsers(friendIds),
  });

  return {
    friends,
    isLoadingFriends,
    isLoadingFriendshipMap,
  };
};

export { useFetchFriends };
