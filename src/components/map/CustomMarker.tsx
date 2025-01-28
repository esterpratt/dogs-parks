import L, { LeafletMouseEvent, PointExpression } from 'leaflet';
import { Marker } from 'react-leaflet';
import { Location } from '../../types/park';
import { useMemo } from 'react';

interface CustomMarkerProps {
  location: Location;
  iconUrl: string;
  iconSize?: number;
  iconAnchor?: PointExpression;
  onClick?: (event: LeafletMouseEvent) => void;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({
  location,
  onClick,
  iconUrl,
  iconSize = 48,
  iconAnchor = [iconSize / 2, iconSize / 2],
}) => {
  const customIcon = useMemo(
    () =>
      L.icon({
        iconUrl,
        iconSize: [iconSize, iconSize],
        iconAnchor,
      }),
    [iconUrl, iconSize, iconAnchor]
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
