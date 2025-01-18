import classnames from 'classnames';
import styles from './Loader.module.scss';

interface LoaderProps {
  className?: string;
  inside?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ className, inside = false }) => {
  return (
    <div className={classnames(styles.container, { [styles.full]: !inside })}>
      <div className={classnames(styles.loader, className)}></div>
    </div>
  );
};

export { Loader };
