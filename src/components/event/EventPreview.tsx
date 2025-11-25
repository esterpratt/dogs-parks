import { Trans } from 'react-i18next';
import { Ban } from 'lucide-react';
import classnames from 'classnames';
import { useDateUtils } from '../../hooks/useDateUtils';
import { ParkEventBase, ParkEventInvite } from '../../types/parkEvent';
import { type ButtonProps, Card } from '../card/Card';
import { ParkImageLazy } from '../park/ParkImageLazy';
import { EventImageOverlay } from './EventImageOverlay';
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

  const { formatFutureCalendar } = useDateUtils();

  const startTime = formatFutureCalendar(startAt);

  return (
    <div
      className={classnames(styles.cardWrapper, {
        [styles.isCancelled]: isCancelled,
      })}
      aria-disabled={isCancelled}
    >
      <Card
        url={!isCancelled ? `/events/${eventId}` : undefined}
        imgCmp={
          <div className={styles.img}>
            <ParkImageLazy parkId={parkId} alt={parkName} hideNoImgIcon lazy />
            <EventImageOverlay size={32} />
          </div>
        }
        detailsCmp={
          <div className={styles.details}>
            <span className={styles.parkName}>{parkName}</span>
            <span className={styles.time}>{startTime}</span>
            {!!invitedBy && (
              <span className={styles.invitedBy}>
                <Trans
                  i18nKey="event.invitedBy"
                  values={{ name: invitedBy }}
                  components={{ name: <span className={styles.name} /> }}
                />
              </span>
            )}
          </div>
        }
        buttons={buttons}
      />
      {isCancelled && (
        <div className={styles.stateOverlay} role="status">
          <div className={styles.stateRail}>
            <Ban size={18} className={styles.stateIcon} />
            {!!cancelledMessage && (
              <span className={styles.stateText}>{cancelledMessage}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { EventPreview };
