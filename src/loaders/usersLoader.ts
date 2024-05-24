import { queryClient } from '../services/react-query';
import { fetchUsersWithDogsByIds } from '../services/users';

const usersLoader = async () => {
  const usersWithDogs = await queryClient.fetchQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsersWithDogsByIds(),
  });

  return { usersWithDogs };
};

export { usersLoader };
