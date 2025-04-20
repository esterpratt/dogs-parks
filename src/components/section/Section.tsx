import { ReactNode } from 'react';
import styles from './Section.module.scss';

interface SectionProps {
  titleCmp: ReactNode;
  contentCmp: ReactNode;
}

const Section = ({ titleCmp, contentCmp }: SectionProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.title}>{titleCmp}</div>
      <div className={styles.content}>{contentCmp}</div>
    </div>
  );
};

export { Section };
