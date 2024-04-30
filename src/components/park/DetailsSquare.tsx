import styles from './DetailsSquare.module.scss';

interface DetailsSqaureProps {
  color?: string;
  content?: string;
  title: string;
}

const DetailsSqaure = ({
  title,
  content = '?',
  color = '#c8c8c8',
}: DetailsSqaureProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.square} style={{ backgroundColor: color }}>
        {content}
      </div>
      <span>{title}</span>
    </div>
  );
};

export { DetailsSqaure };
