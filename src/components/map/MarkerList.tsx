import { useQuery } from '@tanstack/react-query';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Park } from '../../types/park';
import { fetchParksJSON } from '../../services/parks';
import { Loading } from '../Loading';
import { ParkMarker } from './ParkMarker';

interface MarkerListProps {
  activePark: Park | null;
  setActivePark: (park: Park | null) => void;
}

const MarkerList: React.FC<MarkerListProps> = ({
  activePark,
  setActivePark,
}) => {
  const { isLoading, data: parks } = useQuery({
    queryKey: ['parks'],
    queryFn: fetchParksJSON,
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <MarkerClusterGroup
      chunkedLoading
      polygonOptions={{
        stroke: false,
        fill: false,
      }}
    >
      {parks?.map((park) => (
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
