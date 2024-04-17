import { Park } from '../types/park';

interface ParkCardProps {
  park: Park;
}

const ParkCard: React.FC<ParkCardProps> = ({ park }) => {
  return <div>Park {park.name}</div>;
};

export { ParkCard };
