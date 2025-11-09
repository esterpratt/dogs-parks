import { useParams } from 'react-router';
import { EventDetails } from '../components/event/EventDetails';
import styles from './Event.module.scss';
import { useQuery } from '@tanstack/react-query';
import { Loader } from '../components/Loader';
import { fetchEvent } from '../services/events';
import { useParkNamesMap } from '../hooks/useParkNameMap';

const Event: React.FC = () => {
  const { eventId } = useParams();

  const { data, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEvent(eventId!),
    enabled: !!eventId,
  });

  const { parkNamesMap, isLoading: isLoadingParks } = useParkNamesMap();

  if (isLoadingEvent || isLoadingParks) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <EventDetails
        event={data.event}
        invitees={data.invitees}
        parkName={parkNamesMap?.[data.event.park_id] || ''}
      />
    </div>
  );
};

export default Event;
