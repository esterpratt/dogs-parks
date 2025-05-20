import { createStore, StoreApi, useStore } from 'zustand';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { App } from '@capacitor/app';
import { Location } from '../types/park';
import { getUserLocation } from '../components/map/mapHelpers/getUserLocation';
import { DEFAULT_LOCATION } from '../utils/consts';
import { PluginListenerHandle } from '@capacitor/core';

interface LocationStoreProps {
  userLocation: Location | undefined;
  setUserLocation: (location: Location) => void;
  isLocationDenied: boolean;
  setIsLocationDenied: (isLocationDenied: boolean) => void;
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
      isLocationDenied: false,
      setIsLocationDenied: (isLocationDenied) =>
        set(() => ({ isLocationDenied })),
    }))
  );

  const setUserLocation = useStore(store, (state) => state.setUserLocation);
  const setIsLocationDenied = useStore(
    store,
    (state) => state.setIsLocationDenied
  );

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const userLocation = await getUserLocation();
        if (userLocation?.error) {
          setIsLocationDenied(true);
        } else {
          setIsLocationDenied(false);
        }

        if (userLocation) {
          setUserLocation({
            lat: userLocation.position.coords.latitude,
            long: userLocation.position.coords.longitude,
          });
        }
      } catch (error) {
        setUserLocation(DEFAULT_LOCATION);
      }
    };

    let resumeListener: PluginListenerHandle;
    const setupListener = async () => {
      resumeListener = await App.addListener('resume', () => {
        fetchUserLocation();
      });
    };

    setupListener();
    fetchUserLocation();

    return () => {
      resumeListener?.remove();
    };
  }, [setUserLocation, setIsLocationDenied]);

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
