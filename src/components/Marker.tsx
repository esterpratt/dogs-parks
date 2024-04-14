import { Marker as LeafLetMarker, Popup } from 'react-leaflet';
import { Location } from '../types/park';

interface MarkerProps {
  id: string;
  location: Location;
  name: string;
}

const Marker: React.FC<MarkerProps> = ({ id, location, name }) => {
  return (
    <LeafLetMarker position={[location.lat, location.lng]}>
      <Popup>
        Park {name} with id: {id}
      </Popup>
    </LeafLetMarker>
  );
};

export { Marker };
