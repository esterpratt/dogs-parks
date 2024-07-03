import classnames from 'classnames';
import styles from './Loading.module.scss';

interface LoaderProps {
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ className }) => {
  return (
    <div className={styles.container}>
      <div className={classnames(styles.loader, className)}></div>
    </div>
  );
};

export { Loader };
