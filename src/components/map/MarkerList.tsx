import { useQuery } from '@tanstack/react-query';
import { Park } from '../../types/park';
import { fetchParksJSON } from '../../services/parks';
import { Loading } from '../Loading';
import { CustomMarker } from './CustomMarker';

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

  return parks?.map((park) => (
    <CustomMarker
      key={park.id}
      location={park.location}
      onClick={() => setActivePark(park.id === activePark?.id ? null : park)}
    />
  ));
};

export { MarkerList };
