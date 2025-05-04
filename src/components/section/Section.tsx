import { ReactNode } from 'react';
import classnames from 'classnames';
import styles from './Section.module.scss';

interface SectionProps {
  titleCmp: ReactNode | string;
  contentCmp: ReactNode;
  className?: string;
  contentClassName?: string;
}

const Section = (props: SectionProps) => {
  const { titleCmp, contentCmp, className, contentClassName } = props;

  return (
    <div className={classnames(styles.container, className)}>
      <div className={styles.title}>{titleCmp}</div>
      <div className={classnames(styles.content, contentClassName)}>
        {contentCmp}
      </div>
    </div>
  );
};

export { Section };
