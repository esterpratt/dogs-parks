import { ReactNode, createContext, useState } from 'react';
import { AccordionContent } from './AccordionContent';
import { AccordionTitle } from './AccordionTitle';
import { AccordionTitleWithIcon } from './AccordionTitleWithIcon';
import { AccordionArrow } from './AccordionArrow';

interface AccordionProps {
  children: ReactNode;
  className?: string;
}

interface AccordionContextProps {
  isOpen: boolean;
  toggleOpen: () => void;
}

const initialValue: AccordionContextProps = {
  isOpen: true,
  toggleOpen: () => {},
};

const AccordionContext = createContext(initialValue);

const Accordion = ({ children, className }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <AccordionContext.Provider value={{ isOpen, toggleOpen }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  );
};

Accordion.Title = AccordionTitle;
Accordion.TitleWithIcon = AccordionTitleWithIcon;
Accordion.Content = AccordionContent;
Accordion.Arrow = AccordionArrow;

export { Accordion, AccordionContext };
