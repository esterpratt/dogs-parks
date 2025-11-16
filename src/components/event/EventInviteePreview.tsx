import { SyntheticEvent, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import {
  ParkEventInvite,
  ParkEventInviteeStatus,
  ParkEventStatus,
} from '../../types/parkEvent';
import { useUpdateInvitee } from '../../hooks/api/useUpdateInvitee';
import { type ButtonProps } from '../card/Card';
import { Loader } from '../Loader';
import { EventPreview } from './EventPreview';
import styles from './EventPreview.module.scss';
import { useConfirm } from '../../context/ConfirmModalContext';

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
  const { t } = useTranslation();
  const { showModal } = useConfirm();
  const { handleUpdateInvitee, isPendingAccept, isPendingDecline } =
    useUpdateInvitee({
      userId,
    });

  const openDeclineModal = useCallback(
    (ev: SyntheticEvent) => {
      ev.stopPropagation();
      ev.preventDefault();
      showModal({
        title: t('event.invitee.decline.title'),
        confirmText: t('event.invitee.decline.button'),
        onConfirm: async () =>
          handleUpdateInvitee({
            eventId: event.id,
            status: ParkEventInviteeStatus.DECLINED,
          }),
      });
    },
    [event.id, handleUpdateInvitee, t, showModal]
  );

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
    openDeclineModal,
    t,
  ]);

  return (
    <EventPreview
      invitedBy={my_invite_added_by_name}
      buttons={event.status !== ParkEventStatus.CANCELED ? buttons : undefined}
      event={event}
      parkName={parkName}
      cancelledMessage={
        event.status === ParkEventStatus.CANCELED
          ? t('event.cancelled')
          : t('event.declined')
      }
      isCancelled={
        my_invite_status === ParkEventInviteeStatus.DECLINED ||
        event.status === ParkEventStatus.CANCELED
      }
    />
  );
};

export { EventInviteePreview };
