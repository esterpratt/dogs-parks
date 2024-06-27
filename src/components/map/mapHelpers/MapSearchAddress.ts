import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import Geocoder from 'leaflet-control-geocoder';

interface MapSearchAddressProps {
  setCenter: (center: {
    coords: {
      latitude: number;
      longitude: number;
    };
  }) => void;
}

const MapSearchAddress: React.FC<MapSearchAddressProps> = ({ setCenter }) => {
  const map = useMap();

  useEffect(() => {
    const geocoderControl = new Geocoder({
      defaultMarkGeocode: false,
      errorMessage: "Oops! We couldn't sniff out that address",
      position: 'bottomleft',
      placeholder: 'Search Address',
    });
    geocoderControl.addTo(map);
    geocoderControl.on('markgeocode', (event) => {
      const location = event.geocode.center;
      const coords = { latitude: location.lat, longitude: location.lng };
      setCenter({ coords });
    });

    return () => {
      geocoderControl.remove();
    };
  }, [map, setCenter]);

  return null;
};

export { MapSearchAddress };
