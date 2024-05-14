import { useEffect, useRef, useState } from 'react';
import { MdCenterFocusStrong } from 'react-icons/md';
import { GoogleMap } from '@react-google-maps/api';
import classnames from 'classnames';
import styles from './Map.module.scss';
import { MarkerList } from './MarkerList';
import { Location, Park } from '../../types/park';
import { ParkPopup } from './ParkPopup';
import walkSVG from '../../assets/walk.svg';
import { Button } from '../Button';
import { Link } from 'react-router-dom';

interface MapProps {
  className?: string;
}

const DEFAULT_LOCATION = { lat: 32.09992, lng: 34.809212 };

const Map: React.FC<MapProps> = ({ className }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(DEFAULT_LOCATION);
  const [activePark, setActivePark] = useState<Park | null>(null);
  const [directions, setDirections] = useState<
    google.maps.DirectionsResult | undefined
  >();
  const googleMapsDirectionService = useRef(
    new google.maps.DirectionsService()
  );
  const directionsRenderer = useRef(
    new google.maps.DirectionsRenderer({
      suppressInfoWindows: true,
      markerOptions: {
        icon: {
          url: walkSVG,
        },
        clickable: false,
      },
      polylineOptions: { strokeColor: styles.grey, strokeWeight: 5 },
    })
  );

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

  const onCloseParkPopup = () => {
    directionsRenderer.current.setMap(null);
    setActivePark(null);
  };

  const onSetActivePark = (event: google.maps.MapMouseEvent, park: Park) => {
    event.stop();
    setDirections(undefined);
    directionsRenderer.current.setMap(null);
    setActivePark(park);
  };

  const onGetDirections = (location: Location) => {
    googleMapsDirectionService.current.route(
      {
        origin: center,
        destination: { lat: location.latitude, lng: location.longitude },
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          if (result) {
            directionsRenderer.current.setMap(map);
            directionsRenderer.current.setDirections(result);
            setDirections(result);
          }
        } else {
          console.error(`error fetching directions ${result}`);
        }
      }
    );
  };

  return (
    <>
      <div className={classnames(styles.mapContainer, className)}>
        <Link to="/parks" className={styles.listViewButton}>
          <Button variant="orange">List View</Button>
        </Link>
        <GoogleMap
          onLoad={(map) => setMap(map)}
          onUnmount={() => setMap(null)}
          onClick={onCloseParkPopup}
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
          <div className={styles.center} onClick={setUserCenter}>
            <MdCenterFocusStrong size={28} />
          </div>
          <MarkerList setActivePark={onSetActivePark} activePark={activePark} />
        </GoogleMap>
        {directions && (
          <div>
            <div>Distance: {directions?.routes[0].legs[0].distance?.text} </div>
            <div>Duration: {directions?.routes[0].legs[0].duration?.text}</div>
          </div>
        )}
      </div>
      <ParkPopup
        onClose={onCloseParkPopup}
        activePark={activePark}
        onGetDirections={onGetDirections}
        directions={directions}
      />
    </>
  );
};

export { Map };
