import { ReactNode, useContext } from 'react';
import { AccordionContext } from './AccordionContainer';
import classnames from 'classnames';
import styles from './AccordionTitle.module.scss';

interface AccordionTitleProps {
  children: (isOpen: boolean) => ReactNode;
  className?: string;
}

const AccordionTitle: React.FC<AccordionTitleProps> = ({
  children,
  className,
}) => {
  const { toggleOpen, isOpen } = useContext(AccordionContext);

  return (
    <div onClick={toggleOpen} className={classnames(styles.wrapper, className)}>
      {children(isOpen)}
    </div>
  );
};

export { AccordionTitle };
