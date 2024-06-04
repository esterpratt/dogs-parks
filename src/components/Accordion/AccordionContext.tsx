import { createContext } from 'react';

interface AccordionContextProps {
  isOpen: boolean;
  toggleOpen: () => void;
}

const initialValue: AccordionContextProps = {
  isOpen: true,
  toggleOpen: () => {},
};

const AccordionContext = createContext(initialValue);

export { AccordionContext };
