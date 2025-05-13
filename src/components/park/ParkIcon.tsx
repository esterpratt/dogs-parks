import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import classnames from 'classnames';
import { Button } from '../Button';
import styles from './ParkIcon.module.scss';

interface ParkIconProps {
  IconCmp: LucideIcon;
  textCmp: ReactNode;
  onClick: () => void;
  iconColor?: string;
  className?: string;
}

const ParkIcon: React.FC<ParkIconProps> = ({
  IconCmp,
  textCmp,
  onClick,
  iconColor,
  className,
}) => {
  return (
    <Button
      style={{
        '--icon-bgcolor': `${iconColor ?? styles.pink}90`,
        '--icon-color': iconColor ?? styles.pink,
      }}
      className={classnames(styles.button, className)}
      onClick={onClick}
    >
      <IconCmp size={14} />
      {textCmp}
    </Button>
  );
};

export { ParkIcon };
