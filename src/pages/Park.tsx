import { useLoaderData } from 'react-router';
import { Park as ParkType } from '../types/park';
import { ParkGallery } from '../components/Gallery';

const Park: React.FC = () => {
  const park = useLoaderData() as ParkType;

  return (
    <div>
      <span>Park: {park.name}</span>
      <ParkGallery parkId={park.id} />
    </div>
  );
};

export { Park };
