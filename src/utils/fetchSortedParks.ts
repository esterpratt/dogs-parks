import { orderByDistance } from 'geolib';
import { Location, Park } from '../types/park';

export const fetchSortedParks = async (parks: Park[] | undefined, userLocation: Location | undefined) => {
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

// import orderByDistance from 'geolib/es/orderByDistance';
// import { GeolibInputCoordinates } from 'geolib/es/types';
// import { useUserLocation } from '../context/LocationContext';
// import { useMemo } from 'react';

// type GenericWithGeo<T> = T & GeolibInputCoordinates;


// const useDistance = <T>(items: GenericWithGeo<T>[] | undefined) => {
//   const userLocation = useUserLocation((state) => state.userLocation);

//   const sortedItems = useMemo(() => {
//     if (!userLocation || !items?.length) {
//       return items ?? []
//     }

//     const sortedItemsByDistance = orderByDistance({
//         latitude: userLocation.lat,
//         longitude: userLocation.long,
//       }, items)

//     return sortedItemsByDistance;
//   }, [userLocation, items]);
  

//   return sortedItems;
// };

// export { useDistance };
