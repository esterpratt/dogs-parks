import { useState } from 'react';
import { Park } from '../../types/park';
import { useUserLocation } from '../../context/LocationContext';
import { getRoute } from '../../services/map';
import { ParkPopup } from './ParkPopup';

interface DirectionsRaw {
  distanceKm?: number;
  durationSeconds?: number;
  error?: string;
}

interface ParkPopupLazyProps {
  setDirections: (directions: DirectionsRaw | undefined) => void;
  onClose: () => void;
  activePark: Park | null;
  directions?: DirectionsRaw;
}

const ParkPopupLazy = (props: ParkPopupLazyProps) => {
  const { setDirections, onClose, activePark, directions } = props;
  const userLocation = useUserLocation((state) => state.userLocation);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);

  const onCloseParkPopup = () => {
    setDirections(undefined);
    onClose();
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
    <ParkPopup
      isLoadingDirections={isLoadingDirections}
      onClose={onCloseParkPopup}
      activePark={activePark}
      onGetDirections={getDirections}
      canGetDirections={!!userLocation}
      directions={directions}
    />
  );
};

export default ParkPopupLazy;
