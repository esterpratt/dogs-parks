import { useTranslation } from 'react-i18next';
import { useDateUtils } from '../../hooks/useDateUtils';
import { ParkEventBase, ParkEventInvite } from '../../types/parkEvent';
import { type ButtonProps, Card } from '../card/Card';
import { ParkImageLazy } from '../park/ParkImageLazy';
import styles from './EventPreview.module.scss';

interface EventPreviewProps {
  event: ParkEventBase | ParkEventInvite;
  parkName: string;
  isCancelled?: boolean;
  cancelledMessage?: string;
  buttons?: ButtonProps[];
  invitedBy?: string;
}

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
  const { start_at: startAt, id: eventId, park_id: parkId } = event;

  const { t } = useTranslation();

  const { formatFutureCalendar } = useDateUtils();

  const startTime = formatFutureCalendar(startAt);

  return (
    <>
      {!!cancelledMessage && isCancelled && <div>{cancelledMessage}</div>}
      <Card
        url={!isCancelled ? `/events/${eventId}` : undefined}
        imgCmp={
          <div className={styles.img}>
            <ParkImageLazy
              parkId={parkId}
              alt={parkName}
              noImgClassName={styles.noImg}
              iconSize={48}
              lazy
            />
          </div>
        }
        detailsCmp={
          <div className={styles.details}>
            <span>{parkName}</span>
            <span>{startTime}</span>
            {!!invitedBy && t('event.invitedBy', { name: invitedBy })}
          </div>
        }
        buttons={buttons}
      />
    </>
  );
};

export { EventPreview };
