import { useContext, useState } from 'react';
import { Marker } from './Marker';
import { ParksContext } from '../../context/ParksContextProvider';

const MarkerList = () => {
  const { parks } = useContext(ParksContext);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  return parks.map((park) => (
    <Marker
      activeMarker={activeMarker}
      key={park.id}
      id={park.id}
      location={park.location}
      name={park.name}
      setActiveMarker={setActiveMarker}
    />
  ));
};

export { MarkerList };
