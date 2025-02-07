import { createStore, StoreApi, useStore } from 'zustand';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { PluginListenerHandle } from '@capacitor/core';

interface OrientationStoreProps {
  orientation: 'portrait' | 'landscape';
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
}

const OrientationContext = createContext<
  StoreApi<OrientationStoreProps> | undefined
>(undefined);

interface OrientationProviderProps {
  children: ReactNode;
}

export const OrientationProvider = ({ children }: OrientationProviderProps) => {
  const [store] = useState(() =>
    createStore<OrientationStoreProps>((set) => ({
      orientation: 'portrait',
      setOrientation: (orientation) => set(() => ({ orientation })),
    }))
  );

  const setOrientation = useStore(store, (state) => state.setOrientation);

  useEffect(() => {
    let orientationListener: PluginListenerHandle;

    const setupListeners = async () => {
      orientationListener = await ScreenOrientation.addListener(
        'screenOrientationChange',
        (event) => {
          const isLandscape = event.type.includes('landscape');
          setOrientation(isLandscape ? 'landscape' : 'portrait');
        }
      );
    };

    setupListeners();

    return () => {
      orientationListener?.remove();
    };
  }, [setOrientation]);

  return (
    <OrientationContext.Provider value={store}>
      {children}
    </OrientationContext.Provider>
  );
};

export const useOrientationContext = <T,>(
  selector: (state: OrientationStoreProps) => T
) => {
  const context = useContext(OrientationContext);

  if (!context) {
    throw new Error('orientation context was used outside of its provider');
  }

  return useStore(context, selector);
};
