import { useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import { LeafletMouseEvent } from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MapCenter } from '../map/mapHelpers/MapCenter';
import { MapEventHandler } from '../map/mapHelpers/MapEventHandler';
import { ParkMarker } from '../map/ParkMarker';
import { Location } from '../../types/park';
import { DEFAULT_LOCATION } from '../../utils/consts';
import { getUserLocation } from '../map/mapHelpers/getUserLocation';
import { Button } from '../Button';
import styles from './LocationInput.module.scss';

interface LocationInputProps {
  label: string;
  onMapClick: (event: LeafletMouseEvent) => void;
  onSetCurrentLocation: (location: Location) => void;
  markerLocation: Location | null;
  className?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({
  label,
  onMapClick,
  onSetCurrentLocation,
  markerLocation,
  className,
}) => {
  const [center, setCenter] = useState(DEFAULT_LOCATION);
  const mapCenter = useMemo(() => {
    return { lat: center.lat, lng: center.long };
  }, [center]);

  const handleSetCurrentLocation = async () => {
    const userLocation = await getUserLocation();
    if (userLocation?.position) {
      const location = {
        lat: userLocation.position.coords.latitude,
        long: userLocation.position.coords.longitude,
      };
      setCenter(location);
      onSetCurrentLocation(location);
    }
  };

  useEffect(() => {
    const setUserCenter = async () => {
      const userLocation = await getUserLocation();
      if (userLocation?.position) {
        setCenter({
          lat: userLocation.position.coords.latitude,
          long: userLocation.position.coords.longitude,
        });
      }
    };

    setUserCenter();
  }, []);

  return (
    <div className={classnames(styles.container, className)}>
      <label className={styles.label}>
        <div className={styles.title}>{label}</div>
        <div className={styles.instructions}>
          <span>Click the map or </span>
          <Button
            className={styles.button}
            variant="simple"
            onClick={handleSetCurrentLocation}
          >
            use current location
          </Button>
        </div>
      </label>
      <div className={styles.map}>
        <MapContainer
          className={styles.map}
          center={mapCenter}
          zoom={17}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markerLocation && <ParkMarker location={markerLocation} />}
          <MapCenter center={mapCenter} />
          <MapEventHandler onMapClick={onMapClick} />
        </MapContainer>
      </div>
    </div>
  );
};

export { LocationInput };
