import { useQuery } from '@tanstack/react-query';
import { buildFriendshipMap, getFriendIdsByStatus } from '../../utils/friendship';
import { FRIENDSHIP_STATUS, USER_ROLE } from '../../types/friendship';
import { fetchUsersWithDogsByIds } from '../../services/users';
import { FIVE_MINUTES } from '../../utils/consts';
import { queryClient } from '../../services/react-query';
import { getFriendshipMapKey } from './keys';

interface UseFetchFriendsWithDogsProps {
  userId: string;
  status: FRIENDSHIP_STATUS;
  userRole?: USER_ROLE;
}

export const useFetchFriendsWithDogs = ({userId, status, userRole}: UseFetchFriendsWithDogsProps) => {
  const { data: usersWithDogs, isFetching: isLoadingUsersWithDogs } = useQuery({
    queryKey: ['friendsWithDogs', userId, status, userRole],
    queryFn: async () => {
      const map = await queryClient.fetchQuery({
        queryKey: getFriendshipMapKey(userId),
        queryFn: () => buildFriendshipMap(userId),
        staleTime: FIVE_MINUTES,
      });

      const ids = getFriendIdsByStatus({ friendshipMap: map, userId, status, userRole });
      if (ids.length === 0) return [];

      return fetchUsersWithDogsByIds(ids);
    },
    staleTime: FIVE_MINUTES
  });

  return {
    friendsWithDogs: usersWithDogs,
    isLoading: isLoadingUsersWithDogs,
  };
};