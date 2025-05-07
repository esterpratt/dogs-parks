import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { Location, Park } from '../../types/park';
import { MarkerList } from './MarkerList';
import { AlignJustify, Locate } from 'lucide-react';
import { ParkPopup } from '../parks/ParkPopup';
import { MapEventHandler } from './mapHelpers/MapEventHandler';
import { MapCenter } from './mapHelpers/MapCenter';
import { Routing } from './mapHelpers/Routing';
import { getRoute } from '../../services/map';
import { MapSearchAddress } from './mapHelpers/MapSearchAddress';
import { getUserLocation } from './mapHelpers/getUserLocation';
import { UserLocationMarker } from './UserLocationMarker';
import { DEFAULT_LOCATION } from '../../utils/consts';
import { useUserLocation } from '../../context/LocationContext';
import { Button } from '../Button';
import styles from './NewMap.module.scss';

interface NewMapProps {
  className?: string;
  location?: Location | undefined;
}

const NewMap: React.FC<NewMapProps> = ({ location, className }) => {
  const userLocation = useUserLocation((state) => state.userLocation);
  const setUserLocation = useUserLocation((state) => state.setUserLocation);
  const [center, setCenter] = useState(userLocation ?? DEFAULT_LOCATION);
  const [activePark, setActivePark] = useState<Park | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [directions, setDirections] = useState<{
    distance?: string;
    duration?: string;
    error?: string;
    geoJSONObj?: GeoJSON.GeometryObject;
  }>();

  const mapCenter = useMemo(() => {
    return { lat: center.lat, lng: center.long };
  }, [center]);

  const setUserLocationByPosition = useCallback(
    (position: { coords: Location }) => {
      setUserLocation({
        lat: position.coords.lat,
        long: position.coords.long,
      });
    },
    [setUserLocation]
  );

  const setCenterByPosition = (position: {
    coords: { lat: number; long: number };
  }) => {
    setCenter({
      lat: position.coords.lat,
      long: position.coords.long,
    });
  };

  const setUserCenter = async (
    cbc: ((position: { coords: Location }) => void)[]
  ) => {
    const userPosition = await getUserLocation();
    if (userPosition) {
      cbc.forEach((cb) =>
        cb({
          coords: {
            lat: userPosition.coords.latitude,
            long: userPosition.coords.longitude,
          },
        })
      );
    }
  };

  useEffect(() => {
    const setStatesToRun = [setUserLocationByPosition];
    if (location) {
      setCenter({ lat: location.lat, long: location.long });
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
    if (!userLocation) {
      return;
    }
    setIsLoadingDirections(true);
    const res = await getRoute({
      startLocation: {
        lat: userLocation.lat,
        lng: userLocation.long,
      },
      targetLocation: {
        lat: activePark!.location.lat,
        lng: activePark!.location.long,
      },
    });
    setIsLoadingDirections(false);
    if (res) {
      setDirections(res);
    } else {
      setDirections({
        error: 'Sorry, my sniff powers are temporarily offline',
      });
    }
  };

  return (
    <div className={className}>
      <MapContainer
        className={styles.map}
        center={mapCenter}
        zoomControl={false}
        zoom={17}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapSearchAddress setCenter={setCenterByPosition} />
        <Link to="/parks">
          <Button variant="round" className={styles.listViewButton}>
            <AlignJustify />
          </Button>
        </Link>
        <ZoomControl position="topright" />
        <MarkerList setActivePark={onSetActivePark} activePark={activePark} />
        {userLocation && (
          <UserLocationMarker
            location={{
              lat: userLocation.lat,
              long: userLocation.long,
            }}
          />
        )}
        <MapCenter center={mapCenter} />
        {directions?.geoJSONObj && (
          <Routing geoJSONObj={directions?.geoJSONObj} />
        )}
        <Button
          variant="round"
          onClick={() =>
            setUserCenter([setUserLocationByPosition, setCenterByPosition])
          }
          className={styles.centerButton}
        >
          <Locate />
        </Button>
        <MapEventHandler onMapClick={onCloseParkPopup} />
      </MapContainer>
      <ParkPopup
        isLoadingDirections={isLoadingDirections}
        onClose={onCloseParkPopup}
        activePark={activePark}
        onGetDirections={getDirections}
        canGetDirections={!!userLocation}
        directions={
          directions
            ? {
                distance: directions.distance,
                duration: directions.duration,
                error: directions.error,
              }
            : undefined
        }
      />
    </div>
  );
};

export { NewMap };
