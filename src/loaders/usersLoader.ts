import { fetchDogs } from '../services/dogs';
import { fetchUsers } from '../services/users';

const usersLoader = async () => {
  const [users, dogs] = await Promise.all([fetchUsers([]), fetchDogs([])]);
  const usersWithDogs = users?.map((user) => {
    const userDogs = dogs?.filter((dog) => dog.owner === user.id);
    return {
      ...user,
      dogs: userDogs,
    };
  });
  return { usersWithDogs };
};

export { usersLoader };
