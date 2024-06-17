import { LeafletMouseEvent } from 'leaflet';
import parkSVG from '../../assets/park.svg';
import { Location } from '../../types/park';
import { CustomMarker } from './CustomMarker';

interface ParkMarkerProps {
  location: Location;
  onClick?: (event: LeafletMouseEvent) => void;
}

const ParkMarker: React.FC<ParkMarkerProps> = ({ location, onClick }) => {
  return (
    <CustomMarker location={location} onClick={onClick} iconUrl={parkSVG} />
  );
};

export { ParkMarker };
