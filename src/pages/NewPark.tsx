import { GoogleMap } from '@react-google-maps/api';
import { useGoogleMapsLoader } from '../hooks/useGoogleMapsLoader';
import styles from './NewPark.module.scss';
import { useEffect, useState } from 'react';
import { Marker } from '../components/parks/Marker';
import { Location } from '../types/park';

const DEFAULT_LOCATION = { lat: 32.09992, lng: 34.809212 };

const NewPark: React.FC = () => {
  const { isLoaded } = useGoogleMapsLoader();
  const [center, setCenter] = useState(DEFAULT_LOCATION);
  const [marker, setMarker] = useState<Location | null>(null);

  useEffect(() => {
    const setUserCenter = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        });
      }
    };

    setUserCenter();
  }, []);

  const onMapClick = (event: google.maps.MapMouseEvent) => {
    setMarker({
      latitude: event.latLng!.lat(),
      longitude: event.latLng!.lng(),
    });
  };

  return (
    <div>
      {isLoaded && (
        <div className={styles.map}>
          <GoogleMap
            onClick={onMapClick}
            center={center}
            zoom={16}
            clickableIcons={false}
            mapContainerStyle={{
              width: '100%',
              height: '100%',
            }}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              zoomControlOptions: { position: 3 },
              gestureHandling: 'greedy', // DELETE - only for testing
            }}
          >
            {marker && <Marker location={marker} />}
          </GoogleMap>
        </div>
      )}
    </div>
  );
};

export { NewPark };
