import { useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router';
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
import { getUserLocation } from './mapHelpers/getUserLocation';
import { LocationContext } from '../../context/LocationContext';

interface NewMapProps {
  className?: string;
  location?: Location | undefined;
}

const NewMap: React.FC<NewMapProps> = ({ location, className }) => {
  const { userLocation, setUserLocation } = useContext(LocationContext);
  const [center, setCenter] = useState(userLocation);
  const [activePark, setActivePark] = useState<Park | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [directions, setDirections] = useState<{
    distance: string;
    duration: string;
    geoJSONObj: GeoJSON.GeometryObject;
  }>();

  const setUserLocationByPosition = useCallback(
    (position: GeolocationPosition) => {
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    [setUserLocation]
  );

  const setCenterByPosition = (
    position:
      | GeolocationPosition
      | { coords: { latitude: number; longitude: number } }
  ) => {
    setCenter({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  };

  const setUserCenter = async (
    cbc: ((position: GeolocationPosition) => void)[]
  ) => {
    const position = await getUserLocation();
    if (position) {
      cbc.forEach((cb) => cb(position));
    }
  };

  useEffect(() => {
    const setStatesToRun = [setUserLocationByPosition];
    if (location) {
      setCenter({ latitude: location.latitude, longitude: location.longitude });
    } else {
      setStatesToRun.push(setCenterByPosition);
    }
    setUserCenter(setStatesToRun);
  }, [location, setUserLocationByPosition]);

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
      startLocation: {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      },
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
        center={{ lat: center.latitude, lng: center.longitude }}
        zoom={17}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerList setActivePark={onSetActivePark} activePark={activePark} />
        <MapCenter center={{ lat: center.latitude, lng: center.longitude }} />
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
