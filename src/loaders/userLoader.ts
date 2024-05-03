import { LoaderFunction } from 'react-router';
import { fetchUser } from '../services/users';
import { fetchDogs } from '../services/dogs';

const userLoader: LoaderFunction = async ({ params }) => {
  const { id: userId } = params;
  const user = await fetchUser(userId!);
  const dogs = user?.dogs?.length
    ? await fetchDogs(user?.dogs)
    : Promise.resolve(null);
  return { user, dogs };
};

export { userLoader };
