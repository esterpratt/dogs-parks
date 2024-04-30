import { ReactNode, useContext } from 'react';
import classnames from 'classnames';
import { AccordionContext } from './Accordion';
import styles from './AccordionContent.module.scss';

interface AccordionContentProps {
  children: ReactNode;
}

const AccordionContent = ({ children }: AccordionContentProps) => {
  const { isOpen } = useContext(AccordionContext);

  return (
    <div className={classnames(styles.wrapper, isOpen && styles.open)}>
      <div className={styles.content}>{children}</div>
    </div>
  );
};

export { AccordionContent };
