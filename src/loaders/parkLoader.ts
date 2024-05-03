import { LoaderFunction } from 'react-router';
import { fetchPark, fetchParkPrimaryImage } from '../services/parks';

const parkLoader: LoaderFunction = async ({ params }) => {
  const { id: parkId } = params;
  const [park, image] = await Promise.all([
    fetchPark(parkId!),
    fetchParkPrimaryImage(parkId!),
  ]);
  return { park, image: image?.[0] };
};

export { parkLoader };
