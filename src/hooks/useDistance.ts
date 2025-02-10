import { useEffect, useState } from 'react';
import orderByDistance from 'geolib/es/orderByDistance';
import { GeolibInputCoordinates } from 'geolib/es/types';
import { getUserLocation } from '../components/map/mapHelpers/getUserLocation';

type GenericWithGeo<T> = T & GeolibInputCoordinates;

const useDistance = <T>(items: GenericWithGeo<T>[] | undefined) => {
  const [sortedItems, setSortedItems] = useState<GenericWithGeo<T>[]>(
    items ?? []
  );

  useEffect(() => {
    const sortItems = async () => {
      if (!items?.length) {
        setSortedItems(items ?? []);
      } else {
        const userLocation = await getUserLocation();
        if (!userLocation) {
          setSortedItems(items ?? []);
        } else {
          const orderedItems = orderByDistance(
            {
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            },
            items
          );

          setSortedItems(orderedItems as GenericWithGeo<T>[]);
        }
      }
    };

    sortItems();
  }, [items]);

  return sortedItems;
};

export { useDistance };
