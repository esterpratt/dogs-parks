import { useLoaderData } from 'react-router';
import { Park as ParkType } from '../types/park';
import { ParkGallery } from '../components/park/ParkGallery';
import { ParkCheckIn } from '../components/park/ParkCheckIn';
import { BusyHours } from '../components/park/BusyHours';

const Park: React.FC = () => {
  const park = useLoaderData() as ParkType;

  return (
    <div>
      <span>Park: {park.name}</span>
      <BusyHours parkId={park.id} />
      <ParkCheckIn parkId={park.id} />
      <ParkGallery parkId={park.id} />
    </div>
  );
};

export { Park };
