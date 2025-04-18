import { useMap } from 'react-leaflet';
import L from 'leaflet';
import styles from './Routing.module.scss';
import { useEffect } from 'react';

interface RoutingProps {
  geoJSONObj: GeoJSON.GeometryObject;
}

const layers = new L.LayerGroup();

const Routing = ({ geoJSONObj }: RoutingProps) => {
  const map = useMap();

  useEffect(() => {
    layers.clearLayers();

    if (geoJSONObj) {
      layers
        .addLayer(L.geoJSON(geoJSONObj, { style: { color: styles.pink } }))
        .addTo(map);
    }

    return () => {
      layers.clearLayers();
    };
  }, [geoJSONObj, map]);

  return null;
};

export { Routing };
