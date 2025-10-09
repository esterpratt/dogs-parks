// @ts-expect-error - no ts file for openrouteservice-js yet
import Openrouteservice from 'openrouteservice-js';

interface GetRouteProps {
  startLocation: { lat: number; lng: number };
  targetLocation: { lat: number; lng: number };
}

const orsDirections = new Openrouteservice.Directions({
  api_key: import.meta.env.VITE_OPEN_ROUTE_SERVICE_API_KEY,
});

const getRoute = async ({ startLocation, targetLocation }: GetRouteProps) => {
  try {
    const res = await orsDirections.calculate({
      coordinates: [
        [startLocation.lng, startLocation.lat],
        [targetLocation.lng, targetLocation.lat],
      ],
      profile: 'foot-walking',
      format: 'geojson',
    });
    const distanceKm =
      (res.features[0].properties.summary.distance || 0) / 1000;

    const durationSeconds = res.features[0].properties.summary.duration || 0;

    return {
      distanceKm,
      durationSeconds,
      geoJSONObj: res,
    };
  } catch (error) {
    console.error('there was a problem setting directions: ', error);
    return null;
  }
};

export { getRoute };
