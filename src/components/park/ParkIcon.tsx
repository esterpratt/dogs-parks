import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '../Button';
import styles from './ParkIcon.module.scss';

interface ParkIconProps {
  IconCmp: LucideIcon;
  textCmp: ReactNode;
  onClick: () => void;
  iconColor?: string;
}

const ParkIcon: React.FC<ParkIconProps> = ({
  IconCmp,
  textCmp,
  onClick,
  iconColor,
}) => {
  return (
    <div className={styles.container}>
      <Button
        style={{
          '--icon-bgcolor': `${iconColor ?? styles.pink}30`,
          '--icon-color': iconColor ?? styles.pink,
        }}
        className={styles.button}
        onClick={onClick}
      >
        <IconCmp size={18} />
      </Button>
      {textCmp}
    </div>
  );
};

export { ParkIcon };
