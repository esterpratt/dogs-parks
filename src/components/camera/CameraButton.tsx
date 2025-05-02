import { LucideIcon } from 'lucide-react';
import { Button } from '../Button';
import styles from './CameraButton.module.scss';

interface CameraButtonIcons {
  Icon: LucideIcon;
  text: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

const CameraButton = (props: CameraButtonIcons) => {
  const { Icon, text, onClick, variant = 'primary' } = props;

  return (
    <Button variant={variant} className={styles.button} onClick={onClick}>
      <Icon size={20} />
      <span>{text}</span>
    </Button>
  );
};

export { CameraButton };
