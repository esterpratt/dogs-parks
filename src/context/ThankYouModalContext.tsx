import { createStore, StoreApi, useStore } from 'zustand';
import { createContext, ReactNode, useContext, useRef } from 'react';
import { ThankYouModal } from '../components/ThankYouModal';

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
  const storeRef = useRef(
    createStore<ThankYouModalStoreProps>((set) => ({
      isOpen: false,
      setIsOpen: (isOpen) => set(() => ({ isOpen })),
    }))
  );

  const isOpen = useStore(storeRef.current, (state) => state.isOpen);
  const setIsOpen = useStore(storeRef.current, (state) => state.setIsOpen);

  return (
    <ThankYouModalContext.Provider value={storeRef.current}>
      {children}
      <ThankYouModal open={isOpen} onClose={() => setIsOpen(false)} />
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
