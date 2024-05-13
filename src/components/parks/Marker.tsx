import { MarkerF } from '@react-google-maps/api';
import parkSVG from '../../assets/park.svg';
import { Location, Park } from '../../types/park';

interface MarkerProps {
  park: Park;
  location: Location;
  activePark: Park | null;
  setActivePark: (event: google.maps.MapMouseEvent, park: Park | null) => void;
}

const Marker: React.FC<MarkerProps> = ({
  park,
  location,
  activePark,
  setActivePark,
}) => {
  return (
    <MarkerF
      position={{ lat: location.latitude, lng: location.longitude }}
      icon={{ url: parkSVG, fillColor: 'green' }}
      onClick={(event) =>
        setActivePark(event, park.id === activePark?.id ? null : park)
      }
    ></MarkerF>
  );
};

export { Marker };
