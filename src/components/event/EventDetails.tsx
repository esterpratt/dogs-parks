import { ReactNode } from 'react';
import styles from './EventDetails.module.scss';

interface EventDetailsProps {
  eventHeader: ReactNode;
  eventBody: ReactNode;
  eventActions?: ReactNode;
}

const EventDetails = (props: EventDetailsProps) => {
  const { eventHeader, eventBody, eventActions } = props;

  return (
    <div className={styles.container}>
      <div className={styles.scrollableContent}>
        {eventHeader}
        <div className={styles.bodyContainer}>{eventBody}</div>
      </div>
      {!!eventActions && <div className={styles.actions}>{eventActions}</div>}
    </div>
  );
};

export { EventDetails };
