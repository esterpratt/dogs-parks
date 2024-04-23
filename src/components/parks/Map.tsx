import { useJsApiLoader, GoogleMap } from '@react-google-maps/api';
import { MarkerList } from './MarkerList';
import styles from './Map.module.scss';

const Map = () => {
  console.log();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  return (
    <div className={styles.mapContainer}>
      {!isLoaded && <div>Loading...</div>}
      {isLoaded && (
        <GoogleMap
          center={{ lat: 32.066698, lng: 34.811341 }}
          zoom={16}
          mapContainerStyle={{ width: '100%', height: '100%' }}
        >
          <MarkerList />
        </GoogleMap>
      )}
    </div>
  );
};

export { Map };
