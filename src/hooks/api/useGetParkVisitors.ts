import { useQuery } from '@tanstack/react-query';
import { fetchParkCheckins } from '../../services/checkins';
import { useGetFriendsIds } from './useGetFriendsIds';

const FIVE_MINUTES = 1000 * 60 * 5;

const useGetParkVisitors = (parkId: string, userId?: string | null) => {
  const { data: visitorsIds = [], isLoading: isLoadingVisitors } = useQuery({
    queryKey: ['parkVisitors', parkId],
    queryFn: async () => {
      const checkins = await fetchParkCheckins(parkId);
      return checkins ? checkins.map((checkin) => checkin.user_id) : [];
    },
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
  });

  const { friendsIds = [], isLoading: isLoadingFriendsIds } = useGetFriendsIds({
    userId: userId!,
    enabled: !!userId && !!visitorsIds.length,
  });

  const friendsInParkIds = friendsIds.filter((id) => visitorsIds?.includes(id));

  return {
    visitorsIds,
    friendsIds,
    friendsInParkIds,
    isLoadingFriendsIds,
    isLoadingVisitors,
  };
};

export { useGetParkVisitors };
