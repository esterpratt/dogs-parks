import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MdGpsFixed } from 'react-icons/md';
import { Location, Park } from '../../types/park';
import { MarkerList } from './MarkerList';
import styles from './NewMap.module.scss';
import { Button } from '../Button';
import { ParkPopup } from '../parks/ParkPopup';
import { MapEventHandler } from './mapHelpers/MapEventHandler';
import { MapCenter } from './mapHelpers/MapCenter';
import { Routing } from './mapHelpers/Routing';
import { getRoute } from '../../services/map';
import { IconContext } from 'react-icons';
import { MapSearchAddress } from './mapHelpers/MapSearchAddress';

interface NewMapProps {
  className?: string;
  location?: Location | undefined;
}

const DEFAULT_LOCATION = { lat: 32.09992, lng: 34.809212 };

const NewMap: React.FC<NewMapProps> = ({ location, className }) => {
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [center, setCenter] = useState(DEFAULT_LOCATION);
  const [activePark, setActivePark] = useState<Park | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [directions, setDirections] = useState<{
    distance: string;
    duration: string;
    geoJSONObj: GeoJSON.GeometryObject;
  }>();

  const setUserLocationByPosition = (position: GeolocationPosition) => {
    setUserLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
  };

  const setCenterByPosition = (
    position:
      | GeolocationPosition
      | { coords: { latitude: number; longitude: number } }
  ) => {
    setCenter({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
  };

  const setUserCenter = (cbc: ((position: GeolocationPosition) => void)[]) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        cbc.forEach((cb) => {
          cb(position);
        });
      });
    }
  };

  useEffect(() => {
    const setStatesToRun = [setUserLocationByPosition];
    if (location) {
      setCenter({ lat: location.latitude, lng: location.longitude });
    } else {
      setStatesToRun.push(setCenterByPosition);
    }
    setUserCenter(setStatesToRun);
  }, [location]);

  const onCloseParkPopup = () => {
    setDirections(undefined);
    setActivePark(null);
  };

  const onSetActivePark = (park: Park | null) => {
    setDirections(undefined);
    setActivePark(park);
  };

  const getDirections = async () => {
    setIsLoadingDirections(true);
    const res = await getRoute({
      startLocation: userLocation,
      targetLocation: {
        lat: activePark!.location.latitude,
        lng: activePark!.location.longitude,
      },
    });
    setIsLoadingDirections(false);
    if (res) {
      setDirections(res);
    }
  };

  return (
    <div className={className}>
      <Link to="/parks" className={styles.listViewButton}>
        <Button variant="green">To List View</Button>
      </Link>
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
        <MarkerList setActivePark={onSetActivePark} activePark={activePark} />
        <MapCenter center={center} />
        {directions?.geoJSONObj && (
          <Routing geoJSONObj={directions?.geoJSONObj} />
        )}
        <IconContext.Provider value={{ className: styles.centerButton }}>
          <MdGpsFixed
            onClick={() =>
              setUserCenter([setUserLocationByPosition, setCenterByPosition])
            }
          />
        </IconContext.Provider>
        <MapSearchAddress setCenter={setCenterByPosition} />
        <MapEventHandler onMapClick={onCloseParkPopup} />
      </MapContainer>
      <ParkPopup
        isLoadingDirections={isLoadingDirections}
        onClose={onCloseParkPopup}
        activePark={activePark}
        onGetDirections={getDirections}
        directions={
          directions
            ? { distance: directions.distance, duration: directions.duration }
            : undefined
        }
      />
    </div>
  );
};

export { NewMap };
