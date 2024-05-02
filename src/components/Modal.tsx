import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import { CgClose } from 'react-icons/cg';
import styles from './Modal.module.scss';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  className?: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  className,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const modal = dialogRef.current;
    if (open) {
      modal!.showModal();
    }

    return () => modal!.close();
  }, [open]);

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={classnames(styles.modal, className)}
    >
      <CgClose onClick={onClose} size={24} className={styles.close} />
      {children}
    </dialog>,
    document.getElementById('modal')!
  );
};

export { Modal };
