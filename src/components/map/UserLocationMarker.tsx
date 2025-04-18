import { Location } from '../../types/park';
import { CustomMarker } from './CustomMarker';
import mapPin from '../../assets/map-pin.svg';

interface UserLocationMarkerProps {
  location: Location;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  location,
}) => {
  return (
    <CustomMarker
      location={location}
      iconUrl={mapPin}
      iconSize={36}
      iconAnchor={[16, 32]}
    />
  );
};

export { UserLocationMarker };
