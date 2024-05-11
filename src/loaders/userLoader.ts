import { LoaderFunction } from 'react-router';
import { fetchUser } from '../services/users';
import { fetchDogPrimaryImage, fetchUserDogs } from '../services/dogs';

const userLoader: LoaderFunction = async ({ params }) => {
  const { id: userId } = params;
  const [user, dogs = []] = await Promise.all([
    fetchUser(userId!),
    fetchUserDogs(userId!),
  ]);

  const dogImagesPromises: Promise<string[] | null>[] = [];
  dogs.forEach((dog) => {
    dogImagesPromises.push(fetchDogPrimaryImage(dog.id));
  });

  const primaryDogsImages = await Promise.all(dogImagesPromises);

  primaryDogsImages.forEach((dogImages, index) => {
    if (dogImages && dogImages.length) {
      dogs[index].primaryImage = dogImages[0];
    }
  });

  return { user, dogs };
};

export { userLoader };
