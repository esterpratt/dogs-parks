import { CSSProperties } from 'react';
import styles from './DetailsSquare.module.scss';
import classnames from 'classnames';

interface DetailsSqaureProps {
  color: string;
  content?: string;
  title: string;
  className?: string;
  style?: CSSProperties;
}

const DetailsSqaure = ({
  title,
  content = '?',
  color,
  className,
  style = {},
}: DetailsSqaureProps) => {
  return (
    <div className={styles.container}>
      <div
        className={classnames(styles.square, className)}
        style={{
          backgroundColor: color,
          ...style,
        }}
      >
        {content}
      </div>
      <span className={styles.title}>{title}</span>
    </div>
  );
};

export { DetailsSqaure };
