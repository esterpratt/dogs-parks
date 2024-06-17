import L, { LeafletMouseEvent } from 'leaflet';
import parkSVG from '../../assets/park.svg';
import { Marker } from 'react-leaflet';
import { Location } from '../../types/park';
import { useMemo } from 'react';

interface CustomMarkerProps {
  location: Location;
  onClick?: (event: LeafletMouseEvent) => void;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ location, onClick }) => {
  const customIcon = useMemo(
    () =>
      L.icon({
        iconUrl: parkSVG,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      }),
    []
  );

  return (
    <Marker
      position={{ lat: location.latitude, lng: location.longitude }}
      icon={customIcon}
      eventHandlers={onClick ? { click: onClick } : undefined}
    />
  );
};

export { CustomMarker };
