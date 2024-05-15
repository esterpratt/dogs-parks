import { useContext } from 'react';
import { Marker } from './Marker';
import { ParksContext } from '../../context/ParksContext';
import { Park } from '../../types/park';

interface MarkerListProps {
  activePark: Park | null;
  setActivePark: (event: google.maps.MapMouseEvent, park: Park | null) => void;
}

const MarkerList: React.FC<MarkerListProps> = ({
  activePark,
  setActivePark,
}) => {
  const { parks } = useContext(ParksContext);

  return parks.map((park) => (
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
