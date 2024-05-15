import { useJsApiLoader } from '@react-google-maps/api';

import { Map } from './Map';
import { Location } from '../../types/park';

interface MapProps {
  className?: string;
  location: Location | undefined;
}

const MapLoader: React.FC<MapProps> = ({ className, location }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  if (!isLoaded) {
    return null;
  }

  return <Map className={className} location={location} />;
};

export { MapLoader };
