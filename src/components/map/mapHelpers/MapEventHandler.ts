import { LeafletMouseEvent } from 'leaflet';
import { useMapEvents } from 'react-leaflet';

interface MapEventHandlerProps {
  onMapClick: (event: LeafletMouseEvent) => void;
}

const MapEventHandler = ({ onMapClick }: MapEventHandlerProps) => {
  useMapEvents({
    click: onMapClick,
  });

  return null;
};

export { MapEventHandler };
