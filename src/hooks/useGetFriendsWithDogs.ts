import { useQuery } from '@tanstack/react-query';
import { fetchUsersDogs } from '../services/dogs';
import { User } from '../types/user';

interface UseGetFriendsWithDogsProps {
  additionalQueryKey?: string | string[];
  friendIds: string[];
  friendsToMap: User[];
  enabled?: boolean;
}

const useGetFriendsWithDogs = ({
  additionalQueryKey,
  friendIds,
  friendsToMap,
  enabled = true,
}: UseGetFriendsWithDogsProps) => {
  const { data: friendsWithDogs = [], isLoading } = useQuery({
    queryKey: ['friendsDogs', additionalQueryKey],
    queryFn: async () => {
      const dogs = await fetchUsersDogs(friendIds);
      return dogs
        ? friendsToMap.map((friend) => {
            return {
              ...friend,
              dogs: dogs.filter((dog) => dog.owner === friend.id),
            };
          })
        : [];
    },
    enabled,
  });

  return { friendsWithDogs, isLoading };
};

export { useGetFriendsWithDogs };
