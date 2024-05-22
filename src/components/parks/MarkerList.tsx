import { useQuery } from '@tanstack/react-query';
import { Marker } from './Marker';
import { Park } from '../../types/park';
import { fetchParks } from '../../services/parks';
import { Loading } from '../Loading';

interface MarkerListProps {
  activePark: Park | null;
  setActivePark: (event: google.maps.MapMouseEvent, park: Park | null) => void;
}

const MarkerList: React.FC<MarkerListProps> = ({
  activePark,
  setActivePark,
}) => {
  const { isPending, data: parks } = useQuery({
    queryKey: ['parks'],
    queryFn: fetchParks,
  });

  if (isPending) {
    return <Loading />;
  }

  return parks?.map((park) => (
    <Marker
      key={park.id}
      location={park.location}
      onClick={(event) =>
        setActivePark(event, park.id === activePark?.id ? null : park)
      }
    />
  ));
};

export { MarkerList };
