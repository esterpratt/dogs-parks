import { LoaderFunction, redirect } from 'react-router';
import { fetchUser } from '../services/users';
import { fetchDogPrimaryImage, fetchUserDogs } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { User } from '../types/user';
import { Dog } from '../types/dog';

const userLoader: LoaderFunction = async ({ params }) => {
  try {
    const { id: userId } = params;

    const promises: [Promise<User>, Promise<Dog[]>] = [
      queryClient.fetchQuery({
        queryKey: ['user', userId],
        queryFn: () => fetchUser(userId!),
      }),
      queryClient.fetchQuery({
        queryKey: ['dogs', userId],
        queryFn: () => fetchUserDogs(userId!),
      }),
    ];

    const [user, dogs = []] = await Promise.all(promises);

    const getDogsImages = async () => {
      const dogsImagesPromises: Promise<string | null>[] = [];
      dogs.forEach((dog) => {
        dogsImagesPromises.push(
          queryClient.fetchQuery({
            queryKey: ['dogImage', dog.id],
            queryFn: async () => {
              const images = await fetchDogPrimaryImage(dog.id);
              return images?.length ? images[0] : null;
            },
          })
        );
      });

      return Promise.all(dogsImagesPromises);
    };

    return { user, dogs, dogImages: getDogsImages() };
  } catch (error) {
    return redirect('/login');
  }
};

export { userLoader };
