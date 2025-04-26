import { ReactNode } from 'react';
import classnames from 'classnames';
import styles from './Section.module.scss';

interface SectionProps {
  titleCmp: ReactNode | string;
  contentCmp: ReactNode;
  className?: string;
}

const Section = (props: SectionProps) => {
  const { titleCmp, contentCmp, className } = props;

  return (
    <div className={classnames(styles.container, className)}>
      <div className={styles.title}>{titleCmp}</div>
      <div className={styles.content}>{contentCmp}</div>
    </div>
  );
};

export { Section };
