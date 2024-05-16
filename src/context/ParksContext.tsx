import { PropsWithChildren, createContext, useEffect, useState } from 'react';
import { Park } from '../types/park';
import { fetchParks, updatePark } from '../services/parks';
import { fetchFavoriteParks } from '../services/favorites';

interface ParksContextObj {
  parks: Park[];
  favoriteParkIds: string[];
  editPark: (parkId: string, parkDetails: Partial<Omit<Park, 'id'>>) => void;
}

const initialData: ParksContextObj = {
  parks: [],
  favoriteParkIds: [],
  editPark: () => {},
};

const ParksContext = createContext<ParksContextObj>(initialData);

const ParksContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [parks, setParks] = useState<Park[]>([]);
  const [favoriteParkIds, setFavoriteParkIds] = useState<string[]>([]);

  useEffect(() => {
    const getParks = async () => {
      const [parks, favoriteParkIds] = await Promise.all([
        fetchParks(),
        fetchFavoriteParks(),
      ]);

      if (parks) {
        setParks(parks);
      }

      if (favoriteParkIds) {
        setFavoriteParkIds(favoriteParkIds);
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
    favoriteParkIds,
    editPark,
  };

  return (
    <ParksContext.Provider value={value}>{children}</ParksContext.Provider>
  );
};

export { ParksContextProvider, ParksContext };
