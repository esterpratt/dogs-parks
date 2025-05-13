import classnames from 'classnames';
import styles from './Loader.module.scss';
import { CSSProperties } from 'react';

interface LoaderProps {
  className?: string;
  inside?: boolean;
  variant?: 'primary' | 'secondary';
  style?: CSSProperties;
}

const Loader: React.FC<LoaderProps> = ({
  className,
  inside = false,
  variant = 'primary',
  style,
}) => {
  return (
    <div
      className={classnames(styles.container, {
        [styles.full]: !inside,
      })}
      style={style}
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
