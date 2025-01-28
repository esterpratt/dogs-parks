import { createContext, useState, ReactNode } from 'react';
import { Location } from '../types/park';
import { DEFAULT_LOCATION } from '../utils/consts';

interface LocationContextProps {
  userLocation: Location;
  setUserLocation: (location: Location) => void;
}

const LocationContext = createContext<LocationContextProps>({
  userLocation: DEFAULT_LOCATION,
  setUserLocation: () => {},
});

const LocationContextProvider = ({ children }: { children: ReactNode }) => {
  const [userLocation, setUserLocation] = useState<Location>(DEFAULT_LOCATION);

  return (
    <LocationContext.Provider value={{ userLocation, setUserLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export { LocationContextProvider, LocationContext };
