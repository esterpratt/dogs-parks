import { useEffect, useState } from 'react';
import classnames from 'classnames';
import { Location } from '../../types/park';
import styles from './LocationInput.module.scss';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MapCenter } from '../map/mapHelpers/MapCenter';
import { MapEventHandler } from '../map/mapHelpers/MapEventHandler';
import { LeafletMouseEvent } from 'leaflet';
import { ParkMarker } from '../map/ParkMarker';

const DEFAULT_LOCATION = { lat: 32.09992, lng: 34.809212 };

interface LocationInputProps {
  label: string;
  onMapClick: (event: LeafletMouseEvent) => void;
  markerLocation: Location | null;
  className?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({
  label,
  onMapClick,
  markerLocation,
  className,
}) => {
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
      <div className={styles.map}>
        <MapContainer
          className={styles.map}
          center={center}
          zoom={17}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markerLocation && <ParkMarker location={markerLocation} />}
          <MapCenter center={center} />
          <MapEventHandler onMapClick={onMapClick} />
        </MapContainer>
      </div>
    </div>
  );
};

export { LocationInput };
