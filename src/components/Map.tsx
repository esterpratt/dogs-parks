import { MapContainer as LeafLetMapContainer, TileLayer } from 'react-leaflet';
import { MarkerList } from './MarkerList';
import styles from './Map.module.scss';

const Map = () => {
  return (
    <div className={styles.mapContainer}>
      <LeafLetMapContainer
        center={[32.066698, 34.811341]}
        zoom={16}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerList />
      </LeafLetMapContainer>
    </div>
  );
};

export { Map };
