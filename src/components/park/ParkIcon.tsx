import { LucideIcon } from 'lucide-react';
import classnames from 'classnames';
import { Button } from '../Button';
import styles from './ParkIcon.module.scss';

interface ParkIconProps {
  IconCmp: LucideIcon;
  onClick: () => void;
  iconColor?: string;
  className?: string;
}

const ParkIcon: React.FC<ParkIconProps> = ({
  IconCmp,
  onClick,
  iconColor,
  className,
}) => {
  return (
    <Button
      style={{
        '--icon-color': iconColor ?? styles.pink,
      }}
      className={classnames(styles.button, className)}
      onClick={onClick}
    >
      <div className={styles.iconWrapper}>
        <IconCmp size={16} strokeWidth={2.5} />
      </div>
    </Button>
  );
};

export { ParkIcon };
