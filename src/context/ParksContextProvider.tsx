import { createContext, useState } from 'react';
import { Park } from '../types/park';
import { parks as mockParks } from '../data';

const initialParks: Park[] = mockParks;

const ParksContext = createContext<Park[]>(initialParks);

interface ParksContextProviderProps {
  children: React.ReactNode;
  Parks?: Park[];
}

const ParksContextProvider: React.FC<ParksContextProviderProps> = ({
  children,
}) => {
  const [parks /*, setParks*/] = useState(initialParks);
  return (
    <ParksContext.Provider value={parks}>{children}</ParksContext.Provider>
  );
};

export { ParksContextProvider, ParksContext };
