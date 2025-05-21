import { LoaderFunction } from 'react-router-dom';
import { fetchUser } from '../services/users';
import { fetchUserDogs } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { User } from '../types/user';
import { Dog } from '../types/dog';

const userLoader: LoaderFunction = async ({ params }) => {
  const { id: userId } = params;

  const promises: [
    Promise<User>,
    Promise<Dog[]>,
  ] = [
    queryClient.fetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId!),
    }),
    queryClient.fetchQuery({
      queryKey: ['dogs', userId],
      queryFn: () => fetchUserDogs(userId!),
    }),
  ];

  const [user, dogs = []] =
    await Promise.all(promises);

  return {
    user,
    dogs,
  };
};

export { userLoader };