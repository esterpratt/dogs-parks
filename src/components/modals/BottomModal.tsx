import { createPortal } from 'react-dom';
import { ReactNode } from 'react';
import classnames from 'classnames';
import styles from './BottomModal.module.scss';
import { useModal } from './useModal';

interface BottomModalProps {
  open: boolean;
  onClose?: () => void;
  className?: string;
  children: ReactNode;
}

const BottomModal = ({
  open,
  onClose,
  children,
  className,
}: BottomModalProps) => {
  const dialogRef = useModal(open);

  return createPortal(
    <dialog
      ref={dialogRef}
      className={classnames(styles.modal, className)}
      onClose={onClose}
      onClick={onClose}
    >
      {children}
    </dialog>,
    document.getElementById('modal')!
  );
};

export { BottomModal };
