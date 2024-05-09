import { useContext, useState } from 'react';
import { Marker } from './Marker';
import { ParksContext } from '../../context/ParksContext';
import { Location } from '../../types/park';

interface MarkerListProps {
  onGetDirections: (location: Location) => void;
}

const MarkerList: React.FC<MarkerListProps> = ({ onGetDirections }) => {
  const { parks } = useContext(ParksContext);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  return parks.map((park) => (
    <Marker
      activeMarker={activeMarker}
      key={park.id}
      id={park.id}
      location={park.location}
      name={park.name}
      onGetDirections={onGetDirections}
      setActiveMarker={setActiveMarker}
    />
  ));
};

export { MarkerList };
