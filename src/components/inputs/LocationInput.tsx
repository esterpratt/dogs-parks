import { useEffect, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import classnames from 'classnames';
import { useGoogleMapsLoader } from '../../hooks/useGoogleMapsLoader';
import { Marker } from '../parks/Marker';
import { Location } from '../../types/park';
import styles from './LocationInput.module.scss';

const DEFAULT_LOCATION = { lat: 32.09992, lng: 34.809212 };

interface LocationInputProps {
  label: string;
  onMapClick: (event: google.maps.MapMouseEvent) => void;
  markerLocation: Location | null;
  className?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({
  label,
  onMapClick,
  markerLocation,
  className,
}) => {
  const { isLoaded } = useGoogleMapsLoader();
  const [center, setCenter] = useState(DEFAULT_LOCATION);

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

  return (
    <div className={classnames(styles.container, className)}>
      <span>{label}</span>
      {isLoaded && (
        <div className={styles.map}>
          <GoogleMap
            onClick={onMapClick}
            center={center}
            zoom={15}
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
            {markerLocation && <Marker location={markerLocation} />}
          </GoogleMap>
        </div>
      )}
    </div>
  );
};

export { LocationInput };
