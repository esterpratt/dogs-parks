import { ReactNode, useContext } from 'react';
import classnames from 'classnames';
import { AccordionContext } from './Accordion';
import styles from './AccordionContent.module.scss';

interface AccordionContentProps {
  children: ReactNode;
  className?: string;
}

const AccordionContent = ({ children, className }: AccordionContentProps) => {
  const { isOpen } = useContext(AccordionContext);

  return (
    <div
      className={classnames(styles.wrapper, isOpen && styles.open, className)}
    >
      <div className={styles.contentContainer}>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export { AccordionContent };
