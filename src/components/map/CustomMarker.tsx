import L, { LeafletMouseEvent } from 'leaflet';
import { Marker } from 'react-leaflet';
import { Location } from '../../types/park';
import { useMemo } from 'react';

interface CustomMarkerProps {
  location: Location;
  iconUrl: string;
  iconSize?: number;
  onClick?: (event: LeafletMouseEvent) => void;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({
  location,
  onClick,
  iconUrl,
  iconSize = 48,
}) => {
  const customIcon = useMemo(
    () =>
      L.icon({
        iconUrl,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2],
      }),
    [iconUrl, iconSize]
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
