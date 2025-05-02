import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import styles from './NotificationModal.module.scss';
import { useModal } from './useModal';

interface NotificationModalProps {
  message: string | null;
  open: boolean;
  onClose?: () => void;
}

const NotificationModal = ({
  open,
  message,
  onClose,
}: NotificationModalProps) => {
  const dialogRef = useModal(open);

  return createPortal(
    <dialog ref={dialogRef} className={styles.modal} onClose={onClose}>
      <div className={styles.messageContainer}>
        <Check size={32} color={styles.green} />
        <span>{message}</span>
      </div>
    </dialog>,
    document.getElementById('modal')!
  );
};

export { NotificationModal };
