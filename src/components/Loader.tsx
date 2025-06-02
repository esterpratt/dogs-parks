import classnames from 'classnames';
import styles from './Loader.module.scss';
import { CSSProperties } from 'react';
import { useModeContext } from '../context/ModeContext';

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
  const mode = useModeContext((state) => state.mode);

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
          { [styles.secondary]: mode === 'dark' || variant === 'secondary' },
          className
        )}
      ></div>
    </div>
  );
};

export { Loader };
