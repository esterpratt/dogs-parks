import { useEffect, useState } from 'react';
import { MdCenterFocusStrong } from 'react-icons/md';
import { DirectionsRenderer, GoogleMap } from '@react-google-maps/api';
import classnames from 'classnames';
import styles from './Map.module.scss';
import { MarkerList } from './MarkerList';
import { Location } from '../../types/park';

interface MapProps {
  className?: string;
}

const DEFAULT_LOCATION = { lat: 32.09992, lng: 34.809212 };

const Map: React.FC<MapProps> = ({ className }) => {
  const [center, setCenter] = useState(DEFAULT_LOCATION);
  const [directions, setDirections] = useState<
    google.maps.DirectionsResult | undefined
  >();

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

  useEffect(() => {
    setUserCenter();
  }, []);

  const onGetDirections = (location: Location) => {
    const googleMapsDirectionService = new google.maps.DirectionsService();
    googleMapsDirectionService.route(
      {
        origin: center,
        destination: { lat: location.latitude, lng: location.longitude },
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        console.log(status, result);
        if (status === google.maps.DirectionsStatus.OK) {
          if (result) {
            setDirections(result);
          }
        } else {
          console.error(`error fetching directions ${result}`);
        }
      }
    );
  };

  return (
    <div className={classnames(styles.mapContainer, className)}>
      <GoogleMap
        center={center}
        zoom={16}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: 3 },
          gestureHandling: 'greedy', // DELETE - only for testing
        }}
      >
        <div className={styles.center} onClick={setUserCenter}>
          <MdCenterFocusStrong size={28} />
        </div>
        {directions && <DirectionsRenderer directions={directions} />}
        <MarkerList onGetDirections={onGetDirections} />
      </GoogleMap>
      {directions && (
        <div>
          <div>Distance: {directions?.routes[0].legs[0].distance?.text} </div>
          <div>Duration: {directions?.routes[0].legs[0].duration?.text}</div>
        </div>
      )}
    </div>
  );
};

export { Map };
