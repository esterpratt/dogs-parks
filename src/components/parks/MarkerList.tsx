import { useContext } from 'react';
import { Marker } from './Marker';
import { ParksContext } from '../../context/ParksContext';
import { Park } from '../../types/park';

interface MarkerListProps {
  activePark: Park | null;
  setActivePark: (event: google.maps.MapMouseEvent, park: Park) => void;
}

const MarkerList: React.FC<MarkerListProps> = ({
  activePark,
  setActivePark,
}) => {
  const { parks } = useContext(ParksContext);

  return parks.map((park) => (
    <Marker
      activePark={activePark}
      key={park.id}
      park={park}
      location={park.location}
      setActivePark={(event) => setActivePark(event, park)}
    />
  ));
};

export { MarkerList };
