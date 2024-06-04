import { RiArrowDownSLine } from 'react-icons/ri';
import classnames from 'classnames';
import styles from './AccordionArrow.module.scss';

const AccordionArrow: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  return (
    <RiArrowDownSLine
      className={classnames(styles.arrow, isOpen && styles.open)}
    />
  );
};

export { AccordionArrow };
