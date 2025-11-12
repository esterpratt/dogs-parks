import { useNavigate } from 'react-router';
import { useDateUtils } from '../../hooks/useDateUtils';
import { ParkEventBase, ParkEventInvite } from '../../types/parkEvent';
import { type ButtonProps, Card } from '../card/Card';
import styles from './EventPreview.module.scss';
import { useTranslation } from 'react-i18next';

interface EventPreviewProps {
  event: ParkEventBase | ParkEventInvite;
  parkName: string;
  isCancelled?: boolean;
  cancelledMessage?: string;
  buttons?: ButtonProps[];
  invitedBy?: string;
}

interface EventContainerProps {
  isCancelled: boolean;
  cancelledMessage?: string;
  eventId: string;
  children: React.ReactNode;
}

const EventContainer = (props: EventContainerProps) => {
  const { isCancelled, cancelledMessage, eventId, children } = props;
  const navigate = useNavigate();

  const navigateToEvent = () => {
    navigate(`/events/${eventId}`);
  };

  if (!isCancelled) {
    return (
      <div role="button" onClick={navigateToEvent}>
        {children}
      </div>
    );
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
  const {
    event,
    parkName,
    isCancelled = false,
    buttons,
    cancelledMessage,
    invitedBy,
  } = props;
  const { start_at: startAt, id: eventId } = event;

  const { t } = useTranslation();

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
            {!!invitedBy && t('event.invitedBy', { name: invitedBy })}
          </div>
        }
        buttons={buttons}
      />
    </EventContainer>
  );
};

export { EventPreview };
