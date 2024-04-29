import { useLoaderData } from 'react-router';
import { Park as ParkType } from '../types/park';
import { ParkGallery } from '../components/park/ParkGallery';
import { ParkCheckIn } from '../components/park/ParkCheckIn';
import { BusyHours } from '../components/park/BusyHours';
import { ParkVisitors } from '../components/park/ParkVisitors';
import { ReviewsPreview } from '../components/park/ReviewsPreview';

const Park: React.FC = () => {
  const park = useLoaderData() as ParkType;

  return (
    <div>
      <span>Park: {park.name}</span>
      <ReviewsPreview parkId={park.id} />
      <BusyHours parkId={park.id} />
      <ParkCheckIn parkId={park.id} />
      <ParkGallery parkId={park.id} />
      <ParkVisitors parkId={park.id} />
    </div>
  );
};

export { Park };
