import type { LoaderFunction } from 'react-router-dom';
import { redirect } from 'react-router-dom';
import { Network } from '@capacitor/network';

import { queryClient } from '../services/react-query';
import { fetchUser } from '../services/users';
import { fetchUserDogs } from '../services/dogs';
import { signOut } from '../services/authentication';
import { AppError } from '../services/error';
import { USER_NOT_FOUND_ERROR } from '../utils/consts';

import type { User } from '../types/user';
import type { Dog } from '../types/dog';

interface ProfileLoaderData {
  profile: Promise<{
    user: User;
    dogs: Dog[];
  }>;
}

const createProfilePromise = async (userId: string) => {
  try {
    const userPromise = queryClient.fetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
    });

    const dogsPromise = queryClient.fetchQuery({
      queryKey: ['dogs', userId],
      queryFn: () => fetchUserDogs(userId),
    });

    const [user, dogs] = await Promise.all([userPromise, dogsPromise]);

    return {
      user,
      dogs: dogs ?? [],
    };
  } catch (error) {
    if ((error as AppError).message === USER_NOT_FOUND_ERROR) {
      await signOut();
      throw redirect('/login?mode=login');
    }

    throw error;
  }
};

const userLoader: LoaderFunction = async ({ params }) => {
  const { id: userId } = params;

  const status = await Network.getStatus();
  if (!status.connected) {
    throw new Response('Offline', { status: 503, statusText: 'Offline' });
  }

  if (!userId) {
    throw new Response('Missing user id', { status: 400 });
  }

  return {
    profile: createProfilePromise(userId),
  } satisfies ProfileLoaderData;
};

export { userLoader };
export type { ProfileLoaderData };
