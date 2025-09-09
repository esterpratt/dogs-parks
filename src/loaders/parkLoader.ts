import { LoaderFunction } from 'react-router-dom';
import { queryClient } from '../services/react-query';
import { fetchPark } from '../services/parks';
import { Network } from '@capacitor/network';

const parkLoader: LoaderFunction = async ({ params }) => {
  const { id: parkId } = params;

  const status = await Network.getStatus();
  if (!status.connected) {
    throw new Response('Offline', { status: 503, statusText: 'Offline' });
  }

  const parkPromise = queryClient.fetchQuery({
    queryKey: ['park', parkId],
    queryFn: () => fetchPark(parkId!),
  });

  return { park: parkPromise };
};

export { parkLoader };
