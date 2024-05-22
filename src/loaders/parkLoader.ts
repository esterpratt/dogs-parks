import { LoaderFunction } from 'react-router';
import { fetchPark, fetchParkPrimaryImage } from '../services/parks';
import { queryClient } from '../services/react-query';

const parkLoader: LoaderFunction = async ({ params }) => {
  const { id: parkId } = params;

  const park = await queryClient.fetchQuery({
    queryKey: ['park', parkId],
    queryFn: () => fetchPark(parkId!),
  });

  const image = await queryClient.fetchQuery({
    queryKey: ['parkImage', parkId],
    queryFn: async () => {
      const image = await fetchParkPrimaryImage(parkId!);
      return image?.[0];
    },
  });

  return { park, image };
};

export { parkLoader };
