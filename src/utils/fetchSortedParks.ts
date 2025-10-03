import { orderByDistance } from 'geolib';
import { Location, ParkJSON as Park } from '../types/park';

export const fetchSortedParks = async (
  parks: Park[] | undefined,
  userLocation: Location | undefined
) => {
  if (!userLocation || !parks) return parks;

  const parksToSort = parks.map((park) => ({
    ...park,
    latitude: park.location.lat,
    longitude: park.location.long,
  }));

  const sortedParks = orderByDistance(
    {
      latitude: userLocation.lat,
      longitude: userLocation.long,
    },
    parksToSort
  );

  return sortedParks as unknown as Park[];
};
