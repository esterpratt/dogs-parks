import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import Geocoder from 'leaflet-control-geocoder';
import { useOrientationContext } from '../../../context/OrientationContext';

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
  const orientation = useOrientationContext((state) => state.orientation)

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

  useEffect(() => {
    let input: HTMLInputElement | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        input?.blur();
      }
    };

    const observer = new MutationObserver(() => {
      input = document.querySelector('.leaflet-control-geocoder-form input');
      if (input) {
        if (orientation === 'landscape') {
          input.addEventListener('keydown', handleKeyDown);
        }
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      input?.removeEventListener('keydown', handleKeyDown);
    };
  }, [orientation]);

  return null;
};

export { MapSearchAddress };
