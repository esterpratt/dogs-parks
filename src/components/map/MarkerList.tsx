import { useQuery } from '@tanstack/react-query';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Park } from '../../types/park';
import { fetchParkPrimaryImage, fetchParksJSON } from '../../services/parks';
import { ParkMarker } from './ParkMarker';
import { useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { queryClient } from '../../services/react-query';

interface MarkerListProps {
  activePark: Park | null;
  setActivePark: (park: Park | null) => void;
}

const MarkerList: React.FC<MarkerListProps> = ({
  activePark,
  setActivePark,
}) => {
  const { data: parks } = useQuery({
    queryKey: ['parks'],
    queryFn: fetchParksJSON,
  });

  const map = useMap();
  const [visibleParks, setVisibleParks] = useState<Park[]>([]);

  useEffect(() => {
    if (!parks) return;

    const updateVisible = () => {
      const bounds = map.getBounds();
      const visible = parks.filter((park) =>
        bounds.contains(L.latLng(park.location.lat, park.location.long))
      );
      setVisibleParks(visible);

      // Prefetch parks images
      visible.forEach((park) => {
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
