import classnames from 'classnames';
import styles from './AccordionArrow.module.scss';
import { ArrowBigDown } from 'lucide-react';

const AccordionArrow: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  return (
    <ArrowBigDown className={classnames(styles.arrow, isOpen && styles.open)} />
  );
};

export { AccordionArrow };
