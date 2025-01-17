import classnames from 'classnames';
import styles from './Loading.module.scss';
import { useEffect, useState } from 'react';

interface LoaderProps {
  className?: string;
  delay?: number;
  minDisplayTime?: number;
}

const Loader: React.FC<LoaderProps> = ({
  delay = 100,
  minDisplayTime = 700,
  className,
}) => {
  const [show, setShow] = useState(false);
  const [forceDisplay, setForceDisplay] = useState(true);

  useEffect(() => {
    const showTimer = setTimeout(() => setShow(true), delay);
    const hideTimer = setTimeout(() => setForceDisplay(false), minDisplayTime);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [minDisplayTime, delay]);

  if (!show || !forceDisplay) return null;

  return (
    <div className={styles.container}>
      <div className={classnames(styles.loader, className)}></div>
    </div>
  );
};

export { Loader };
