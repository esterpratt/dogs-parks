import { ReactNode } from 'react';
import styles from './ChooseCamera.module.scss';

interface ChooseCameraProps {
  title?: string;
  children: ReactNode;
  error?: string | DOMException | null;
}

const ChooseCamera = (props: ChooseCameraProps) => {
  const { title, children, error } = props;

  return (
    <div className={styles.container}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.buttonsContainer}>{children}</div>
      <div className={styles.error}>{!!error && `Sorry. ${error}`}</div>
    </div>
  );
};

export { ChooseCamera };
