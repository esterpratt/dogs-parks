import { createStore, StoreApi, useStore } from 'zustand';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Location } from '../types/park';
import { getUserLocation } from '../components/map/mapHelpers/getUserLocation';
import { DEFAULT_LOCATION } from '../utils/consts';

interface LocationStoreProps {
  userLocation: Location | undefined;
  setUserLocation: (location: Location) => void;
}

const UserLocationContext = createContext<
  StoreApi<LocationStoreProps> | undefined
>(undefined);

interface UserLocationProviderProps {
  children: ReactNode;
}

export const UserLocationProvider = ({
  children,
}: UserLocationProviderProps) => {
  const [store] = useState(() =>
    createStore<LocationStoreProps>((set) => ({
      userLocation: undefined,
      setUserLocation: (userLocation) => set(() => ({ userLocation })),
    }))
  );

  const setUserLocation = useStore(store, (state) => state.setUserLocation);

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const userLocation = await getUserLocation();
        if (userLocation) {
          setUserLocation({
            lat: userLocation?.coords.latitude,
            long: userLocation?.coords.longitude,
          });
        }
      } catch (error) {
        console.error('Error fetching user location:', error);
        setUserLocation(DEFAULT_LOCATION);
      }
    };

    fetchUserLocation();
  }, [setUserLocation]);

  return (
    <UserLocationContext.Provider value={store}>
      {children}
    </UserLocationContext.Provider>
  );
};

export const useUserLocation = <T,>(
  selector: (state: LocationStoreProps) => T
) => {
  const context = useContext(UserLocationContext);

  if (!context) {
    throw new Error('userLocation context was used outside of its provider');
  }

  return useStore(context, selector);
};
