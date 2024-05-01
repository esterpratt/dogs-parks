import { ReactNode, useContext } from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';
import { AccordionContext } from './Accordion';
import classnames from 'classnames';
import styles from './AccordionTitle.module.scss';

interface AccordionTitleProps {
  children: ReactNode;
}

const AccordionTitle = ({ children }: AccordionTitleProps) => {
  const { toggleOpen, isOpen } = useContext(AccordionContext);

  return (
    <div onClick={toggleOpen} className={styles.wrapper}>
      {children}
      <RiArrowDownSLine
        className={classnames(styles.arrow, isOpen && styles.open)}
      />
    </div>
  );
};

export { AccordionTitle };
