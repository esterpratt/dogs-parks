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
import { PluginListenerHandle } from '@capacitor/core';
import { initializeUserLocation } from '../utils/initializeUserLocation';

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

  useEffect(() => {
    let resumeListener: PluginListenerHandle;
    const setupListener = async () => {
      resumeListener = await App.addListener('resume', () => {
        const { userLocation, isLocationDenied } = store.getState();

        if (userLocation && !isLocationDenied) {
          return;
        }

        const { setIsLocationDenied, setUserLocation } = store.getState();
        initializeUserLocation({ setIsLocationDenied, setUserLocation });
      });
    };
    setupListener();
    return () => {
      resumeListener?.remove();
    };
  }, [store]);

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
