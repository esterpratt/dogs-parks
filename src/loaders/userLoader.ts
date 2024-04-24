import { LoaderFunction } from 'react-router';
import { fetchUser } from '../services/users';

const userLoader: LoaderFunction = async ({ params }) => {
  const { id: userId } = params;
  const user = await fetchUser(userId!);
  return user;
};

export { userLoader };
