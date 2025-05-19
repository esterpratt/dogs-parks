import { useQuery } from '@tanstack/react-query';
import { FIVE_MINUTES } from '../../utils/consts';
import { getFriendshipMapKey } from './keys';
import { buildFriendshipMap } from '../../utils/friendship';

export const useUserFriendshipMap = (userId?: string | null) => {
  return useQuery({
    queryKey: getFriendshipMapKey(userId),
    queryFn: () => buildFriendshipMap(userId!),
    enabled: !!userId,
    staleTime: FIVE_MINUTES,
    gcTime: FIVE_MINUTES,
  });
};