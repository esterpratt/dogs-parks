import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { ParkInviteModal } from './ParkInviteModal';
import { ParkIcon } from './ParkIcon';
import styles from './ParkCheckIn.module.scss';

interface ParkInviteProps {
  parkId: string;
  userId: string;
}

const ParkInvite = (props: ParkInviteProps) => {
  const { parkId, userId } = props;
  const [openInviteModal, setOpenInviteModal] = useState(false);

  return (
    <div>
      <ParkIcon
        IconCmp={CalendarPlus}
        iconColor={styles.pink}
        onClick={() => setOpenInviteModal(true)}
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
