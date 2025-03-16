import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import Geocoder from 'leaflet-control-geocoder';

interface MapSearchAddressProps {
  setCenter: (center: {
    coords: {
      lat: number;
      long: number;
    };
  }) => void;
}

const MapSearchAddress: React.FC<MapSearchAddressProps> = ({ setCenter }) => {
  const map = useMap();

  useEffect(() => {
    const geocoderControl = new Geocoder({
      // @ts-expect-error - nominatim exists on Gecoder
      geocoder: new Geocoder.nominatim({
        geocodingQueryParams: {
          countrycodes: 'il',
          limit: 3,
        },
      }),
      defaultMarkGeocode: false,
      errorMessage: "Oops! We couldn't sniff out that address",
      position: 'topleft',
      placeholder: 'Search Address',
    });
    geocoderControl.addTo(map);
    geocoderControl.on('markgeocode', (event) => {
      const location = event.geocode.center;
      const coords = { lat: location.lat, long: location.lng };
      setCenter({ coords });
    });

    return () => {
      geocoderControl.remove();
    };
  }, [map, setCenter]);

  return null;
};

export { MapSearchAddress };
