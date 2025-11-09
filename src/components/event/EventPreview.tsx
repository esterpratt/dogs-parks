import { Link } from 'react-router';
import { useDateUtils } from '../../hooks/useDateUtils';
import { ParkEventBase, ParkEventInvite } from '../../types/parkEvent';
import { Card } from '../card/Card';
import styles from './EventPreview.module.scss';

interface EventPreviewProps {
  event: ParkEventBase | ParkEventInvite;
  parkName: string;
  isCancelled?: boolean;
  cancelledMessage?: string;
}

interface EventContainerProps {
  isCancelled: boolean;
  cancelledMessage?: string;
  eventId: string;
  children: React.ReactNode;
}

const EventContainer = (props: EventContainerProps) => {
  const { isCancelled, cancelledMessage, eventId, children } = props;

  if (!isCancelled) {
    return <Link to={`/events/${eventId}`}>{children}</Link>;
  }

  return (
    <div>
      {!!cancelledMessage && <span>{cancelledMessage}</span>}
      {children}
    </div>
  );
};

const EventPreview: React.FC<EventPreviewProps> = (
  props: EventPreviewProps
) => {
  const { event, parkName, isCancelled = false, cancelledMessage } = props;
  const { start_at: startAt, id: eventId } = event;

  const { formatFutureCalendar } = useDateUtils();

  const startTime = formatFutureCalendar(startAt);

  return (
    <EventContainer
      isCancelled={isCancelled}
      cancelledMessage={cancelledMessage}
      eventId={eventId}
    >
      <Card
        imgCmp={<></>}
        detailsCmp={
          <div className={styles.details}>
            <span>{parkName}</span>
            <span>{startTime}</span>
          </div>
        }
      />
    </EventContainer>
  );
};

export { EventPreview };
