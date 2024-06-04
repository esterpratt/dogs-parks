import { ReactNode, useState } from 'react';
import { AccordionContent } from './AccordionContent';
import { AccordionTitle } from './AccordionTitle';
import { AccordionTitleWithIcon } from './AccordionTitleWithIcon';
import { AccordionArrow } from './AccordionArrow';
import { AccordionContext } from './AccordionContext';

interface AccordionProps {
  children: ReactNode;
  className?: string;
}

const AccordionContainer = ({ children, className }: AccordionProps) => {
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

AccordionContainer.Title = AccordionTitle;
AccordionContainer.TitleWithIcon = AccordionTitleWithIcon;
AccordionContainer.Content = AccordionContent;
AccordionContainer.Arrow = AccordionArrow;

export { AccordionContainer };
