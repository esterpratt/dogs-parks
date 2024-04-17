import { Link } from 'react-router-dom';

interface MarkerPopupProps {
  parkId: string;
  parkName: string;
}

const MarkerPopup: React.FC<MarkerPopupProps> = ({ parkId, parkName }) => {
  return (
    <Link to={`/parks/${parkId}`}>
      <div>Park {parkName}</div>
    </Link>
  );
};

export { MarkerPopup };
