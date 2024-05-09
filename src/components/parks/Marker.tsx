import { MarkerF, OverlayViewF, OverlayView } from '@react-google-maps/api';
import { Location } from '../../types/park';
import { MarkerPopup } from './MarkerPopup';

interface MarkerProps {
  id: string;
  location: Location;
  name: string;
  activeMarker: string | null;
  setActiveMarker: (id: string | null) => void;
  onGetDirections: (location: Location) => void;
}

const Marker: React.FC<MarkerProps> = ({
  id,
  location,
  name,
  activeMarker,
  setActiveMarker,
  onGetDirections,
}) => {
  return (
    <MarkerF
      position={{ lat: location.latitude, lng: location.longitude }}
      onClick={() => setActiveMarker(id === activeMarker ? null : id)}
    >
      {activeMarker === id && (
        <OverlayViewF
          position={{ lat: location.latitude, lng: location.longitude }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <MarkerPopup
            parkId={id}
            parkName={name}
            onGetDirections={() => onGetDirections(location)}
          />
        </OverlayViewF>
      )}
    </MarkerF>
  );
};

export { Marker };
