import { ChangeEvent, useContext, useState } from 'react';
import { ParksContext } from '../context/ParksContextProvider';
import { useDebounce } from '../hooks/useDebounce';
import { Park } from '../types/park';
import { ParkCard } from './ParkCard';

const ParksList: React.FC = () => {
  const { parks } = useContext(ParksContext);
  const [input, setInput] = useState<string>('');
  const { searchInput } = useDebounce(input);

  const filteredParks: Park[] = parks.filter((park) => {
    return park.name.toLowerCase().includes(searchInput.toLowerCase());
  });

  const onChangeInput = (event: ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  return (
    <div>
      <input value={input} onChange={onChangeInput} />
      {filteredParks.map((park) => (
        <ParkCard key={park.id} park={park} />
      ))}
    </div>
  );
};

export { ParksList };
