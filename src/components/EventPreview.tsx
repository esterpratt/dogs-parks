import { useDateUtils } from '../hooks/useDateUtils';
import { ParkEventBase, ParkEventInvite } from '../types/parkEvent';
import { Card } from './card/Card';
import styles from './EventPreview.module.scss';

interface EventPreviewProps {
  event: ParkEventBase | ParkEventInvite;
  parkName: string;
}

const EventPreview: React.FC<EventPreviewProps> = (
  props: EventPreviewProps
) => {
  const { event, parkName } = props;
  const { start_at: startAt } = event;

  const { formatFutureCalendar } = useDateUtils();

  const startTime = formatFutureCalendar(startAt);

  return (
    <Card
      imgCmp={<></>}
      detailsCmp={
        <div className={styles.details}>
          <span>{parkName}</span>
          <span>{startTime}</span>
        </div>
      }
    />
  );
};

export { EventPreview };
