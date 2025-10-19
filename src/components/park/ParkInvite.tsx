import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { ParkIcon } from './ParkIcon';
import styles from './ParkCheckIn.module.scss';
import { useTranslation } from 'react-i18next';
import { ParkInviteModal } from './ParkInviteModal';

interface ParkInviteProps {
  parkId: string;
  userId: string;
}

const ParkInvite = (props: ParkInviteProps) => {
  const { parkId, userId } = props;
  const { t } = useTranslation();
  const [openInviteModal, setOpenInviteModal] = useState(false);

  return (
    <div>
      <ParkIcon
        IconCmp={CalendarPlus}
        iconColor={styles.pink}
        onClick={() => setOpenInviteModal(true)}
        textCmp={<span>{t('invite.buttonTxt')}</span>}
      />
      <ParkInviteModal
        parkId={parkId}
        userId={userId}
        isOpen={openInviteModal}
        onClose={() => setOpenInviteModal(false)}
      />
    </div>
  );
};

export { ParkInvite };
