import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import styles from './NotificationModal.module.scss';
import { useModal } from './useModal';

interface NotificationModalProps {
  message: string | null;
  open: boolean;
  isError: boolean;
  onClose?: () => void;
}

const NotificationModal = ({
  open,
  message,
  isError,
  onClose,
}: NotificationModalProps) => {
  const dialogRef = useModal(open);

  return createPortal(
    <dialog ref={dialogRef} className={styles.modal} onClose={onClose}>
      <div className={styles.messageContainer}>
        {isError && <X size={32} color={styles.red} />}
        {!isError && <Check size={32} color={styles.green} />}
        <span>{message}</span>
      </div>
    </dialog>,
    document.getElementById('modal')!
  );
};

export { NotificationModal };
