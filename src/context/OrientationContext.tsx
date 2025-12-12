import { createStore, StoreApi, useStore } from 'zustand';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
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
  const [store] = useState(() => {
    // Get initial orientation synchronously
    const mediaQuery = window.matchMedia('(orientation: landscape)');
    const initialOrientation = mediaQuery.matches ? 'landscape' : 'portrait';

    return createStore<OrientationStoreProps>((set) => ({
      orientation: initialOrientation,
      setOrientation: (orientation) => set(() => ({ orientation })),
    }));
  });

  const setOrientation = useStore(store, (state) => state.setOrientation);

  // Update with ScreenOrientation API if available (for more accuracy on native)
  useLayoutEffect(() => {
    const getInitialOrientation = async () => {
      try {
        const currentOrientation = await ScreenOrientation.orientation();
        const isLandscape = currentOrientation.type.includes('landscape');
        setOrientation(isLandscape ? 'landscape' : 'portrait');
      } catch (error) {
        // Already set via media query, no action needed
      }
    };

    getInitialOrientation();
  }, [setOrientation]);

  // Set up listeners for orientation changes
  useEffect(() => {
    let orientationListener: PluginListenerHandle;

    const setupListeners = async () => {
      try {
        orientationListener = await ScreenOrientation.addListener(
          'screenOrientationChange',
          (event) => {
            const isLandscape = event.type.includes('landscape');
            setOrientation(isLandscape ? 'landscape' : 'portrait');
          }
        );
      } catch (error) {
        // If ScreenOrientation API is not available, fall back to media query listener
        const mediaQuery = window.matchMedia('(orientation: landscape)');
        const handler = (e: MediaQueryListEvent) => {
          setOrientation(e.matches ? 'landscape' : 'portrait');
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
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

// eslint-disable-next-line react-refresh/only-export-components
export const useOrientationContext = <T,>(
  selector: (state: OrientationStoreProps) => T
) => {
  const context = useContext(OrientationContext);

  if (!context) {
    throw new Error('orientation context was used outside of its provider');
  }

  return useStore(context, selector);
};
