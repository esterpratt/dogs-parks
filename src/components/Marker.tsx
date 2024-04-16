import { MarkerF, OverlayViewF, OverlayView } from '@react-google-maps/api';
import { Location } from '../types/park';

interface MarkerProps {
  id: string;
  location: Location;
  name: string;
  activeMarker: string | null;
  setActiveMarker: (id: string | null) => void;
}

const Marker: React.FC<MarkerProps> = ({
  id,
  location,
  name,
  activeMarker,
  setActiveMarker,
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
          <div>
            Park {name} with id: {id}
          </div>
        </OverlayViewF>
      )}
    </MarkerF>
  );
};

export { Marker };
