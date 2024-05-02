import styles from './DetailsSquare.module.scss';
import classnames from 'classnames';

interface DetailsSqaureProps {
  color: string;
  content?: string;
  title: string;
  className?: string;
}

const DetailsSqaure = ({
  title,
  content = '?',
  color,
  className,
}: DetailsSqaureProps) => {
  return (
    <div className={styles.container}>
      <div
        className={classnames(styles.square, className)}
        style={{
          backgroundColor: color,
        }}
      >
        {content}
      </div>
      <span className={styles.title}>{title}</span>
    </div>
  );
};

export { DetailsSqaure };
