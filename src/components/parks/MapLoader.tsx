import { useJsApiLoader } from '@react-google-maps/api';

import { Map } from './Map';

interface MapProps {
  className?: string;
}

const MapLoader: React.FC<MapProps> = ({ className }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  if (!isLoaded) {
    return null;
  }

  return <Map className={className} />;
};

export { MapLoader };
