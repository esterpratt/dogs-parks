import { useEffect, useState } from 'react';
import orderByDistance from 'geolib/es/orderByDistance';
import { GeolibInputCoordinates } from 'geolib/es/types';

type GenericWithGeo<T> = T & GeolibInputCoordinates;

const useDistance = <T>(items: GenericWithGeo<T>[] | undefined) => {
  const [sortedItems, setSortedItems] = useState<GenericWithGeo<T>[]>(
    items ?? []
  );

  useEffect(() => {
    if (!items || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const orderedItems = orderByDistance(
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        items
      );
      setSortedItems(orderedItems as GenericWithGeo<T>[]);
    });
  }, [items]);

  return sortedItems;
};

export { useDistance };
