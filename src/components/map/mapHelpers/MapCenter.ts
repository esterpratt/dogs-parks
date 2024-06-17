import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { LatLngLiteral } from 'leaflet';

interface MapCenterProps {
  center: LatLngLiteral;
}

const MapCenter = ({ center }: MapCenterProps) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo([center.lat, center.lng]);
  }, [center, map]);

  return null;
};

export { MapCenter };
