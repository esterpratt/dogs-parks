import { queryClient } from '../services/react-query';
import { fetchUsersWithDogsByIds } from '../services/users';

const usersLoader = async () => {
  const users = await queryClient.fetchQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsersWithDogsByIds(),
  });

  const onlyUsersWithDogs = users?.filter((user) => user.dogs?.length);

  return { usersWithDogs: onlyUsersWithDogs };
};

export { usersLoader };
