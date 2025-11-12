import { useContext } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { UserContext } from '../context/UserContext';
import { fetchEvent } from '../services/events';
import { useAppLocale } from '../hooks/useAppLocale';
import { parkKey } from '../hooks/api/keys';
import {
  fetchParkPrimaryImage,
  fetchParkWithTranslation,
} from '../services/parks';
import { Loader } from '../components/Loader';
import { InviteeEvent } from '../components/event/InvitedEvent';
import { OrganizerEvent } from '../components/event/OrganizerEvent';
import styles from './Event.module.scss';

const Event = () => {
  const { eventId } = useParams();
  const { userId } = useContext(UserContext);

  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEvent(eventId!),
    enabled: !!eventId,
  });

  const currentLanguage = useAppLocale();

  const { data: park, isLoading: isLoadingPark } = useQuery({
    queryKey: parkKey(eventData?.event.park_id || '', currentLanguage),
    queryFn: () =>
      fetchParkWithTranslation({
        parkId: eventData.event.park_id,
        language: currentLanguage,
      }),
    enabled: !!eventData?.event.park_id,
    placeholderData: (prev) => prev,
  });

  const { data: parkImage, isLoading: isLoadingImage } = useQuery({
    queryKey: ['parkImage', eventData?.event.park_id],
    queryFn: async () => fetchParkPrimaryImage(eventData.event.park_id),
    enabled: !!eventData?.event.park_id,
  });

  const userIsOrganizer =
    userId && eventData && userId === eventData.event.creator_id;

  if (isLoadingEvent || isLoadingPark || isLoadingImage) {
    return <Loader />;
  }

  if (!userId) {
    return null;
  }

  return (
    <div className={styles.container}>
      {userIsOrganizer ? (
        <OrganizerEvent
          event={eventData.event}
          invitees={eventData?.invitees}
          parkName={park!.name}
          parkImage={parkImage!}
          userId={userId}
        />
      ) : (
        <InviteeEvent
          event={eventData.event}
          invitees={eventData?.invitees}
          parkName={park!.name}
          parkImage={parkImage!}
          userId={userId!}
        />
      )}
    </div>
  );
};

export default Event;
