import { Park } from '../../types/park';
interface ParkCardProps {
  park: Park;
}

const ParkCard: React.FC<ParkCardProps> = ({ park }) => {
  return (
    <div>
      <span>Park {park.name}</span>
    </div>
  );
};

export { ParkCard };
