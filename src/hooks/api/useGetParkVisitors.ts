import { useQuery } from '@tanstack/react-query';
import { fetchParkCheckins } from '../../services/checkins';
import { useUserFriendshipMap } from './useUserFriendshipMap';
import { getFriendIdsByStatus } from '../../utils/friendship';
import { FRIENDSHIP_STATUS } from '../../types/friendship';

const useGetParkVisitors = (parkId: string, userId?: string | null) => {
  const { data: visitorsIds = [], isLoading: isLoadingVisitors } = useQuery({
    queryKey: ['parkVisitors', parkId],
    queryFn: async () => {
      const checkins = await fetchParkCheckins(parkId);
      return checkins ? checkins.map((checkin) => checkin.user_id) : [];
    },
    staleTime: 6000,
    gcTime: 6000,
  });

  const {
    data: friendshipMap,
    isLoading: isLoadingFriendshipMap,
  } = useUserFriendshipMap(userId);

  const friendIds = friendshipMap ? getFriendIdsByStatus({
    friendshipMap,
    status: FRIENDSHIP_STATUS.APPROVED,
  }): [];

  const friendsInParkIds = (visitorsIds as string[]).filter(id => friendIds.includes(id));

  return {
    visitorsIds,
    friendsInParkIds,
    isLoadingVisitors,
    isLoadingFriendIds: (!!userId && isLoadingFriendshipMap),
  };
};

export { useGetParkVisitors };
