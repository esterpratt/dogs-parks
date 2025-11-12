import { SyntheticEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router';
import { Check, X } from 'lucide-react';
import {
  fetchUserInvitedEvents,
  fetchUserOrganizedEvents,
} from '../services/events';
import { User } from '../types/user';
import {
  ParkEventBase,
  ParkEventInvite,
  ParkEventInviteeStatus,
  ParkEventStatus,
} from '../types/parkEvent';
import { useParkNamesMap } from '../hooks/useParkNameMap';
import { useUpdateInvitee } from '../hooks/api/useUpdateInvitee';
import { type ButtonProps } from '../components/card/Card';
import { Loader } from '../components/Loader';
import { EventPreview } from '../components/event/EventPreview';
import { DeclineInviteeModal } from '../components/event/DeclineInviteeModal';
import styles from './UserEvents.module.scss';

const UserEvents = () => {
  const [pendingDeclineEventId, setPendingDeclineEventId] = useState<
    string | null
  >(null);
  const { t } = useTranslation();
  const { user } = useOutletContext() as { user: User };

  const { data: organizedEvents, isLoading: isLoadingOrganizedEvents } =
    useQuery({
      queryKey: ['events', 'organized', user.id],
      queryFn: fetchUserOrganizedEvents,
    });

  const { data: invitedEvents, isLoading: isLoadingInvitedEvents } = useQuery({
    queryKey: ['events', 'invited', user.id],
    queryFn: fetchUserInvitedEvents,
  });

  const { parkNamesMap, isLoading: isLoadingParks } = useParkNamesMap();

  const { handleUpdateInvitee, isPendingAccept, isPendingDecline } =
    useUpdateInvitee({
      userId: user.id,
      onSettledDecline: () => setPendingDeclineEventId(null),
    });

  const isDeclineInviteModalOpen = !!pendingDeclineEventId;

  const openDeclineModal = (ev: SyntheticEvent, eventId: string) => {
    ev.stopPropagation();
    setPendingDeclineEventId(eventId);
  };

  const closeDeclineModal = () => {
    setPendingDeclineEventId(null);
  };

  const handleAcceptInvitee = (ev: SyntheticEvent, eventId: string) => {
    ev.stopPropagation();
    handleUpdateInvitee({
      eventId,
      status: ParkEventInviteeStatus.ACCEPTED,
    });
  };

  const confirmDecline = () => {
    if (!pendingDeclineEventId) {
      return;
    }
    handleUpdateInvitee({
      eventId: pendingDeclineEventId,
      status: ParkEventInviteeStatus.DECLINED,
    });
  };

  const buildButtons = (event: ParkEventInvite) => {
    const buttons: ButtonProps[] = [];

    if (
      event.my_invite_status === ParkEventInviteeStatus.INVITED ||
      event.my_invite_status === ParkEventInviteeStatus.ACCEPTED
    ) {
      if (event.my_invite_status === ParkEventInviteeStatus.INVITED) {
        buttons.push({
          children: (
            <>
              {isPendingAccept ? (
                <Loader variant="secondary" inside className={styles.loader} />
              ) : (
                <>
                  <Check size={12} />

                  <span>{t('common.actions.accept')}</span>
                </>
              )}
            </>
          ),
          onClick: (ev: SyntheticEvent) => handleAcceptInvitee(ev, event.id),
          disabled: isPendingAccept,
        });
      }

      buttons.push({
        children: (
          <>
            <X size={12} />
            <span>{t('common.actions.decline')}</span>
          </>
        ),
        variant: 'secondary',
        onClick: (ev: SyntheticEvent) => openDeclineModal(ev, event.id),
        disabled: isPendingAccept,
      });
    }

    return buttons;
  };

  if (isLoadingOrganizedEvents || isLoadingInvitedEvents || isLoadingParks) {
    return <Loader inside className={styles.loader} />;
  }

  return (
    <>
      <div className={styles.container}>
        <span className={styles.title}>{t('userEvents.upcomingEvents')}</span>
        {!!organizedEvents?.length && (
          <div className={styles.eventsContainer}>
            <div className={styles.subtitle}>
              {t('userEvents.organizedEvents')}
            </div>
            {organizedEvents.map((event: ParkEventBase) => (
              <EventPreview
                isCancelled={event.status === ParkEventStatus.CANCELED}
                cancelledMessage={t('event.cancelled')}
                key={event.id}
                event={event}
                parkName={parkNamesMap?.[event.park_id] || ''}
              />
            ))}
          </div>
        )}
        {!!invitedEvents?.length && (
          <div className={styles.eventsContainer}>
            <div className={styles.subtitle}>
              {t('userEvents.invitedEvents')}
            </div>
            {invitedEvents.map((event: ParkEventInvite) => (
              <EventPreview
                isCancelled={
                  event.my_invite_status === ParkEventInviteeStatus.DECLINED
                }
                cancelledMessage={t('event.declined')}
                key={event.id}
                event={event}
                parkName={parkNamesMap?.[event.park_id] || ''}
                buttons={buildButtons(event)}
                invitedBy={event.my_invite_added_by_name}
              />
            ))}
          </div>
        )}
      </div>
      <DeclineInviteeModal
        handleDeclineInvite={confirmDecline}
        isOpen={isDeclineInviteModalOpen}
        closeModal={closeDeclineModal}
        isPendingDecline={isPendingDecline}
      />
    </>
  );
};

export default UserEvents;
