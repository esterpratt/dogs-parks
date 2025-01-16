import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useState,
  lazy,
} from 'react';
const ThankYouModal = lazy(() => import('../components/ThankYouModal'));

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
      <ThankYouModal open={isOpen} onClose={() => setIsOpen(false)} />
    </ThankYouModalContext.Provider>
  );
};

export { ThankYouModalContextProvider, ThankYouModalContext };
