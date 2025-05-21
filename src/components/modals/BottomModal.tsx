import { createPortal } from 'react-dom';
import { MouseEvent, ReactNode } from 'react';
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

  const onCloseModal = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className={classnames(styles.modal, className)}
      onClose={onClose}
      onClick={onCloseModal}
    >
      {children}
    </dialog>,
    document.getElementById('modal')!
  );
};

export { BottomModal };
