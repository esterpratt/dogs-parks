import { useLoaderData } from 'react-router';
import { Park as ParkType } from '../types/park';

const Park: React.FC = () => {
  const park = useLoaderData() as ParkType;

  return <div>Park: {park.name}</div>;
};

export { Park };
