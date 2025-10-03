import { useQuery } from '@tanstack/react-query';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type { ParkJSON as Park } from '../../types/park';
import { fetchParkPrimaryImage } from '../../services/parks';
import { ParkMarker } from './ParkMarker';
import { useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { queryClient } from '../../services/react-query';
import { useAppLocale } from '../../hooks/useAppLocale';
import { fetchParksJSON } from '../../services/parks';
import { parksKey } from '../../hooks/api/keys';
import { usePrefetchOtherLanguages } from '../../hooks/api/usePrefetchOtherLanguages';

interface MarkerListProps {
  activePark: Park | null;
  setActivePark: (park: Park | null) => void;
}

const MarkerList: React.FC<MarkerListProps> = ({
  activePark,
  setActivePark,
}) => {
  const currentLanguage = useAppLocale();

  const { data: parks } = useQuery({
    queryKey: parksKey(currentLanguage),
    queryFn: () => fetchParksJSON({ language: currentLanguage }),
    placeholderData: (previous) => previous,
    retry: 0,
  });

  usePrefetchOtherLanguages({ currentLanguage });

  const map = useMap();
  const [visibleParks, setVisibleParks] = useState<Park[]>([]);

  useEffect(() => {
    if (!parks) {
      return;
    }

    const updateVisible = () => {
      const bounds = map.getBounds();
      const parksArray = (parks ?? []) as Park[];
      const visible = parksArray.filter((park: Park) =>
        bounds.contains(L.latLng(park.location.lat, park.location.long))
      );
      setVisibleParks(visible);

      // Prefetch parks images
      visible.forEach((park: Park) => {
        queryClient.prefetchQuery({
          queryKey: ['parkImage', park.id],
          queryFn: () => fetchParkPrimaryImage(park.id),
        });
      });
    };

    map.on('moveend', updateVisible);
    updateVisible();

    return () => {
      map.off('moveend', updateVisible);
    };
  }, [map, parks]);

  return (
    <MarkerClusterGroup
      chunkedLoading
      polygonOptions={{
        stroke: false,
        fill: false,
      }}
    >
      {visibleParks.map((park) => (
        <ParkMarker
          key={park.id}
          location={park.location}
          onClick={() =>
            setActivePark(park.id === activePark?.id ? null : park)
          }
        />
      ))}
    </MarkerClusterGroup>
  );
};

export { MarkerList };
