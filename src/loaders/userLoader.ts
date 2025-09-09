import { LoaderFunction, redirect } from 'react-router-dom';
import { fetchUser } from '../services/users';
import { fetchUserDogs } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { AppError } from '../services/error';
import { signOut } from '../services/authentication';
import { USER_NOT_FOUND_ERROR } from '../utils/consts';
import { Network } from '@capacitor/network';

const userLoader: LoaderFunction = async ({ params }) => {
  const { id: userId } = params;

  const status = await Network.getStatus();
  if (!status.connected) {
    throw new Response('Offline', { status: 503, statusText: 'Offline' });
  }

  let user, dogs: Dog[];

  try {
    const promises: [Promise<User>, Promise<Dog[]>] = [
      queryClient.fetchQuery({
        queryKey: ['user', userId],
        queryFn: () => fetchUser(userId!),
      }),
      queryClient.fetchQuery({
        queryKey: ['dogs', userId],
        queryFn: () => fetchUserDogs(userId!),
      }),
    ];

    [user, dogs = []] = await Promise.all(promises);

    return {
      user,
      dogs,
    };
  } catch (error: unknown) {
    if ((error as AppError).message === USER_NOT_FOUND_ERROR) {
      await signOut();
      return redirect('/login?mode=login');
    }
  }
};

export { userLoader };
