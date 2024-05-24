import { LoaderFunction } from 'react-router';
import { fetchUser } from '../services/users';
import { fetchDogPrimaryImage, fetchUserDogs } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { User } from '../types/user';
import { Dog } from '../types/dog';

const userLoader: LoaderFunction = async ({ params }) => {
  const { id: userId } = params;

  const promises: [Promise<User>, Promise<Dog[]>] = [
    queryClient.fetchQuery({
      queryKey: ['users', userId],
      queryFn: () => fetchUser(userId!),
    }),
    queryClient.fetchQuery({
      queryKey: ['dogs', userId],
      queryFn: () => fetchUserDogs(userId!),
    }),
  ];

  const [user, dogs = []] = await Promise.all(promises);

  const dogImagesPromises: Promise<string | null>[] = [];
  dogs.forEach((dog) => {
    dogImagesPromises.push(
      queryClient.fetchQuery({
        queryKey: ['dogImage', dog.id],
        queryFn: async () => {
          const images = await fetchDogPrimaryImage(dog.id);
          return images?.length ? images[0] : null;
        },
      })
    );
  });

  const primaryDogsImages = await Promise.all(dogImagesPromises);

  primaryDogsImages.forEach((dogImage, index) => {
    if (dogImage) {
      dogs[index].primaryImage = dogImage;
    }
  });

  return { user, dogs };
};

export { userLoader };
