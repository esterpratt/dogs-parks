import { LoaderFunction } from 'react-router-dom';
import { fetchUser } from '../services/users';
import { fetchDogPrimaryImage, fetchUserDogs } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { fetchUserFriendships } from '../services/friendships';
import { Friendship, FRIENDSHIP_STATUS } from '../types/friendship';

const userLoader: LoaderFunction = async ({ params }) => {
  const { id: userId } = params;

  const promises: [
    Promise<User>,
    Promise<Dog[]>,
    Promise<Friendship | null>,
    Promise<Friendship | null>
  ] = [
    queryClient.fetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId!),
    }),
    queryClient.fetchQuery({
      queryKey: ['dogs', userId],
      queryFn: () => fetchUserDogs(userId!),
    }),
    queryClient.fetchQuery({
      queryKey: ['friendships', userId, 'pending'],
      queryFn: () =>
        fetchUserFriendships({
          userId: userId!,
          status: FRIENDSHIP_STATUS.PENDING,
        }),
    }),
    queryClient.fetchQuery({
      queryKey: ['friendships', userId, 'approved'],
      queryFn: () =>
        fetchUserFriendships({
          userId: userId!,
        }),
    }),
  ];

  const [user, dogs = [], pendingFriendships, approvedFriendships] =
    await Promise.all(promises);

  const getDogsImages = async () => {
    const dogsImagesPromises: Promise<string | null>[] = [];
    dogs.forEach((dog) => {
      dogsImagesPromises.push(
        queryClient.fetchQuery({
          queryKey: ['dogImage', dog.id],
          queryFn: async () => {
            const image = await fetchDogPrimaryImage(dog.id);
            return image || null;
          },
        })
      );
    });

    return Promise.all(dogsImagesPromises);
  };

  return {
    user,
    dogs,
    dogImages: getDogsImages(),
    pendingFriendships,
    approvedFriendships,
  };
};

export { userLoader };