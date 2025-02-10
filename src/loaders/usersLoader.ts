import { queryClient } from '../services/react-query';
import { fetchUsersWithDogsByIds } from '../services/users';

const usersLoader = async () => {
  const users = await queryClient.fetchQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsersWithDogsByIds(),
  });

  const nonPrivateUsersWithDogs = users?.filter(
    (user) => user.dogs?.length && !user.private
  );

  return { usersWithDogs: nonPrivateUsersWithDogs };
};

export { usersLoader };
