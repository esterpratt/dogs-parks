import classnames from 'classnames';
import styles from './Loader.module.scss';

interface LoaderProps {
  className?: string;
  inside?: boolean;
  variant?: 'primary' | 'secondary';
}

const Loader: React.FC<LoaderProps> = ({
  className,
  inside = false,
  variant = 'primary',
}) => {
  return (
    <div
      className={classnames(styles.container, {
        [styles.full]: !inside,
      })}
    >
      <div
        className={classnames(
          styles.loader,
          { [styles.secondary]: variant === 'secondary' },
          className
        )}
      ></div>
    </div>
  );
};

export { Loader };
