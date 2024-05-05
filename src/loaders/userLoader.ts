import { LoaderFunction } from 'react-router';
import { fetchUser } from '../services/users';
import {
  fetchAllDogsImages,
  fetchDogPrimaryImage,
  fetchUserDogs,
} from '../services/dogs';

const userLoader: LoaderFunction = async ({ params }) => {
  const { id: userId } = params;
  const [user, dogs = []] = await Promise.all([
    fetchUser(userId!),
    fetchUserDogs(userId!),
  ]);
  const imagesByDog: {
    [dogId: string]: { primary?: string; other?: string[] };
  } = {};
  for (const dog of dogs) {
    const [primary, other] = await Promise.all([
      fetchDogPrimaryImage(dog.id),
      fetchAllDogsImages(dog.id),
    ]);
    imagesByDog[dog.id] = {
      primary: primary?.[0],
      other,
    };
  }

  return { user, dogs, imagesByDog };
};

export { userLoader };
