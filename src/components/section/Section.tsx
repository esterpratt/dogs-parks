import { ReactNode, useState } from 'react';
import classnames from 'classnames';
import { ChevronDown } from 'lucide-react';
import styles from './Section.module.scss';

interface SectionProps {
  title: string;
  actions?: ReactNode;
  contentCmp: ReactNode;
  className?: string;
  contentClassName?: string;
}

const Section = (props: SectionProps) => {
  const { title, actions, contentCmp, className, contentClassName } = props;
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={classnames(styles.container, className)}>
      <div className={styles.header}>
        <button
          className={styles.titleButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown
            size={20}
            className={classnames(styles.chevron, {
              [styles.chevronOpen]: isOpen,
            })}
          />
          <span>{title}</span>
        </button>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div
        className={classnames(styles.content, {
          [styles.contentOpen]: isOpen,
        })}
      >
        <div className={contentClassName}>{contentCmp}</div>
      </div>
    </div>
  );
};

export { Section };
