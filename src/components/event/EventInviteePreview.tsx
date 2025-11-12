import { SyntheticEvent, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { ParkEventInvite, ParkEventInviteeStatus } from '../../types/parkEvent';
import { useUpdateInvitee } from '../../hooks/api/useUpdateInvitee';
import { type ButtonProps } from '../card/Card';
import { Loader } from '../Loader';
import { EventPreview } from './EventPreview';
import { DeclineInviteeModal } from './DeclineInviteeModal';
import styles from './EventPreview.module.scss';

interface EventPreviewProps {
  event: ParkEventInvite;
  parkName: string;
  userId: string;
}

const EventInviteePreview: React.FC<EventPreviewProps> = (
  props: EventPreviewProps
) => {
  const { event, parkName, userId } = props;

  const { my_invite_status, my_invite_added_by_name } = event;
  const [isDeclineModalOpen, setisDeclineModalOpen] = useState(false);
  const { handleUpdateInvitee, isPendingAccept, isPendingDecline } =
    useUpdateInvitee({
      userId,
      onSettledDecline: () => setisDeclineModalOpen(false),
    });

  const openDeclineModal = (ev: SyntheticEvent) => {
    ev.stopPropagation();
    ev.preventDefault();
    setisDeclineModalOpen(true);
  };

  const closeDeclineModal = () => {
    setisDeclineModalOpen(false);
  };

  const handleAcceptInvitee = useCallback(
    (ev: SyntheticEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
      handleUpdateInvitee({
        eventId: event.id,
        status: ParkEventInviteeStatus.ACCEPTED,
      });
    },
    [event.id, handleUpdateInvitee]
  );

  const confirmDecline = () => {
    handleUpdateInvitee({
      eventId: event.id,
      status: ParkEventInviteeStatus.DECLINED,
    });
  };

  const { t } = useTranslation();

  const buttons = useMemo(() => {
    const buttons: ButtonProps[] = [];

    if (
      my_invite_status === ParkEventInviteeStatus.INVITED ||
      my_invite_status === ParkEventInviteeStatus.ACCEPTED
    ) {
      if (my_invite_status === ParkEventInviteeStatus.INVITED) {
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
          onClick: handleAcceptInvitee,
          disabled: isPendingAccept || isPendingDecline,
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
        onClick: openDeclineModal,
        disabled: isPendingAccept || isPendingDecline,
      });
    }

    return buttons;
  }, [
    isPendingAccept,
    isPendingDecline,
    my_invite_status,
    handleAcceptInvitee,
    t,
  ]);

  return (
    <>
      <EventPreview
        invitedBy={my_invite_added_by_name}
        buttons={buttons}
        event={event}
        parkName={parkName}
        cancelledMessage={t('event.declined')}
        isCancelled={my_invite_status === ParkEventInviteeStatus.DECLINED}
      />
      <DeclineInviteeModal
        handleDeclineInvite={confirmDecline}
        isOpen={isDeclineModalOpen}
        closeModal={closeDeclineModal}
        isPendingDecline={isPendingDecline}
      />
    </>
  );
};

export { EventInviteePreview };
