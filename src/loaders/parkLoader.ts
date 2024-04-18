import { LoaderFunction } from 'react-router';
import { fetchPark } from '../services/parks';

const parkLoader: LoaderFunction = async ({ params }) => {
  const { id: parkId } = params;
  const park = await fetchPark(parkId!);
  return park;
};

export { parkLoader };
