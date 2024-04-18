import { PropsWithChildren, createContext, useEffect, useState } from 'react';
import { Park } from '../types/park';
import { fetchParks } from '../services/parks';

interface ParksContextObj {
  parks: Park[];
}

const initialData: ParksContextObj = {
  parks: [],
};

const ParksContext = createContext<ParksContextObj>(initialData);

const ParksContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [parks, setParks] = useState<Park[]>([]);

  useEffect(() => {
    const getParks = async () => {
      const parks = await fetchParks();
      setParks(parks);
    };

    getParks();
  }, []);

  const value: ParksContextObj = {
    parks,
  };

  return (
    <ParksContext.Provider value={value}>{children}</ParksContext.Provider>
  );
};

export { ParksContextProvider, ParksContext };
