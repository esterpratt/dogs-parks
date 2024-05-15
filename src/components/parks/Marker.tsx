import { MarkerF } from '@react-google-maps/api';
import parkSVG from '../../assets/park.svg';
import { Location } from '../../types/park';

interface MarkerProps {
  location: Location;
  onClick?: (event: google.maps.MapMouseEvent) => void;
}

const Marker: React.FC<MarkerProps> = ({ onClick, location }) => {
  return (
    <MarkerF
      position={{ lat: location.latitude, lng: location.longitude }}
      icon={{ url: parkSVG, fillColor: 'green' }}
      onClick={onClick}
    ></MarkerF>
  );
};

export { Marker };
