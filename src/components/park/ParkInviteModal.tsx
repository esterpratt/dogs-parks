import { useTranslation } from 'react-i18next';
import { FormModal } from '../modals/FormModal';
import { useState } from 'react';

interface ParkInviteModalProps {
  parkId?: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ParkInviteModal = (props: ParkInviteModalProps) => {
  const { /*parkId, userId,*/ isOpen, onClose } = props;
  const [invitedFriends /*setInvitedFriends*/] = useState([]);
  const { t } = useTranslation();
  // const TIME_OPTIONS = [
  //   t('invite.movile.time.now'),
  //   t('invite.movile.time.15min'),
  //   t('invite.movile.time.30min'),
  //   t('invite.movile.time.hour'),
  // ];
  // const [fromTime, setFromTime] = useState(TIME_OPTIONS[0]);

  const handleCreateEvent = () => {};

  return (
    <FormModal
      open={isOpen}
      onClose={onClose}
      onSave={handleCreateEvent}
      saveText={t('invite.modal.buttonText')}
      disabled={!invitedFriends.length}
      title={t('.invite.modal.title')}
    >
      <div>Invite friends to park</div>
    </FormModal>
  );
};

export { ParkInviteModal };
