import { PropsWithChildren, createContext, useEffect, useState } from 'react';
import { Park } from '../types/park';
import { fetchParks, updatePark } from '../services/parks';

interface ParksContextObj {
  parks: Park[];
  editPark: (parkId: string, parkDetails: Partial<Omit<Park, 'id'>>) => void;
}

const initialData: ParksContextObj = {
  parks: [],
  editPark: () => {},
};

const ParksContext = createContext<ParksContextObj>(initialData);

const ParksContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [parks, setParks] = useState<Park[]>([]);

  useEffect(() => {
    const getParks = async () => {
      const parks = await fetchParks();
      if (parks) {
        setParks(parks);
      }
    };

    getParks();
  }, []);

  const editPark = async (
    parkId: string,
    parkDetails: Partial<Omit<Park, 'id'>>
  ) => {
    await updatePark(parkId, parkDetails);
    const editedPark = parks.find((park) => park.id === parkId);
    if (editedPark) {
      const newParks = parks.filter((park) => park.id !== editedPark.id);
      setParks([...newParks, { ...editedPark, ...parkDetails }]);
    }
  };

  const value: ParksContextObj = {
    parks,
    editPark,
  };

  return (
    <ParksContext.Provider value={value}>{children}</ParksContext.Provider>
  );
};

export { ParksContextProvider, ParksContext };
