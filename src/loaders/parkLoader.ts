import { LoaderFunction } from 'react-router-dom';
import { queryClient } from '../services/react-query';
import { fetchPark } from '../services/parks';

const parkLoader: LoaderFunction = async ({ params }) => {
  const { id: parkId } = params;

  const parkPromise = queryClient.fetchQuery({
    queryKey: ['park', parkId],
    queryFn: () => fetchPark(parkId!),
  });

  return { park: parkPromise };
};

export { parkLoader };