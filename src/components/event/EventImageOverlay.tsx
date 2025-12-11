import { CalendarHeart } from 'lucide-react';
import styles from './EventImageOverlay.module.scss';

interface EventImageOverlayProps {
  size?: number;
}

const EventImageOverlay = (props: EventImageOverlayProps) => {
  const { size = 40 } = props;

  return (
    <div className={styles.overlay}>
      <CalendarHeart className={styles.icon} size={size} />
    </div>
  );
};

export { EventImageOverlay };
