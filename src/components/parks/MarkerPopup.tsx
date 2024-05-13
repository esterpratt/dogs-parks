// TODO: DELETE - NOT IN USE

import { Link } from 'react-router-dom';

interface MarkerPopupProps {
  parkId: string;
  parkName: string;
  onGetDirections: () => void;
}

const MarkerPopup: React.FC<MarkerPopupProps> = ({
  parkId,
  parkName,
  onGetDirections,
}) => {
  return (
    <div>
      <Link to={`/parks/${parkId}`}>
        <div>Park {parkName}</div>
      </Link>
      <button onClick={onGetDirections}>Get me there</button>
    </div>
  );
};

export { MarkerPopup };
