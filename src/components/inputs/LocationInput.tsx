import { useEffect, useState } from 'react';
import classnames from 'classnames';
import { LeafletMouseEvent } from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MapCenter } from '../map/mapHelpers/MapCenter';
import { MapEventHandler } from '../map/mapHelpers/MapEventHandler';
import { ParkMarker } from '../map/ParkMarker';
import { Location } from '../../types/park';
import { DEFAULT_LOCATION } from '../../utils/consts';
import { getUserLocation } from '../map/mapHelpers/getUserLocation';
import styles from './LocationInput.module.scss';

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
    const setUserCenter = async () => {
      const userLocation = await getUserLocation();
      if (userLocation) {
        setCenter({
          lat: userLocation.coords.latitude,
          long: userLocation.coords.longitude,
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
          center={{ lat: center.lat, lng: center.long }}
          zoom={17}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markerLocation && <ParkMarker location={markerLocation} />}
          <MapCenter center={{ lat: center.lat, lng: center.long }} />
          <MapEventHandler onMapClick={onMapClick} />
        </MapContainer>
      </div>
    </div>
  );
};

export { LocationInput };
