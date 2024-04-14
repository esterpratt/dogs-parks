import { useContext } from 'react';
import { Marker } from './Marker';
import { ParksContext } from '../context/ParksContextProvider';
import { Park } from '../types/park';

const MarkerList = () => {
  const parks = useContext<Park[]>(ParksContext);

  return parks.map((park) => (
    <Marker
      key={park.id}
      id={park.id}
      location={park.location}
      name={park.name}
    />
  ));
};

export { MarkerList };
