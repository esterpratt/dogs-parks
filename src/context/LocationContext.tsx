import { createContext, useState, ReactNode } from 'react';
import { Location } from '../types/park';

interface LocationContextProps {
  userLocation: Location | undefined;
  setUserLocation: (location: Location) => void;
}

const LocationContext = createContext<LocationContextProps>({
  userLocation: undefined,
  setUserLocation: () => {},
});

const LocationContextProvider = ({ children }: { children: ReactNode }) => {
  const [userLocation, setUserLocation] = useState<Location>();

  return (
    <LocationContext.Provider value={{ userLocation, setUserLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export { LocationContextProvider, LocationContext };
