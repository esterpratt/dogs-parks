import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useState,
} from 'react';
import { ThankYouModal } from '../components/ThankYouModal';

interface ThankYouModalContextObj {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const initialData: ThankYouModalContextObj = {
  isOpen: false,
  setIsOpen: () => {},
};

const ThankYouModalContext =
  createContext<ThankYouModalContextObj>(initialData);

const ThankYouModalContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const value: ThankYouModalContextObj = {
    isOpen,
    setIsOpen,
  };

  return (
    <ThankYouModalContext.Provider value={value}>
      {children}
      <ThankYouModal />
    </ThankYouModalContext.Provider>
  );
};

export { ThankYouModalContextProvider, ThankYouModalContext };
