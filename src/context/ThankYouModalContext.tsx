import { createStore, StoreApi, useStore } from 'zustand';
import {
  createContext,
  ReactNode,
  useContext,
  useState,
  Suspense,
  lazy,
} from 'react';
const ThankYouModal = lazy(() => import('../components/ThankYouModal'));

interface ThankYouModalStoreProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ThankYouModalContext = createContext<
  StoreApi<ThankYouModalStoreProps> | undefined
>(undefined);

interface ThankYouModalProviderProps {
  children: ReactNode;
}

export const ThankYouModalProvider = ({
  children,
}: ThankYouModalProviderProps) => {
  const [store] = useState(() =>
    createStore<ThankYouModalStoreProps>((set) => ({
      isOpen: false,
      setIsOpen: (isOpen) => set(() => ({ isOpen })),
    }))
  );

  const isOpen = useStore(store, (state) => state.isOpen);
  const setIsOpen = useStore(store, (state) => state.setIsOpen);

  return (
    <ThankYouModalContext.Provider value={store}>
      {children}
      <Suspense fallback={null}>
        <ThankYouModal open={isOpen} onClose={() => setIsOpen(false)} />
      </Suspense>
    </ThankYouModalContext.Provider>
  );
};

export const useThankYouModalContext = <T,>(
  selector: (state: ThankYouModalStoreProps) => T
) => {
  const context = useContext(ThankYouModalContext);

  if (!context) {
    throw new Error('thank you modal context was used outside of its provider');
  }

  return useStore(context, selector);
};
