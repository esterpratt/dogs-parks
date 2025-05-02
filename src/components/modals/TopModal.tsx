import { createPortal } from 'react-dom';
import { MouseEvent, ReactNode } from 'react';
import classnames from 'classnames';
import { useModal } from './useModal';
import styles from './TopModal.module.scss';

interface TopModalProps {
  open: boolean;
  onClose?: () => void;
  className?: string;
  children: ReactNode;
  height?: number | null;
}

const TopModal = ({
  open,
  onClose,
  children,
  className,
  height,
}: TopModalProps) => {
  const dialogRef = useModal(open);

  const onCloseModal = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  return createPortal(
    <dialog
      style={{ height: height ? `${height}%` : 'fit-content' }}
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

export { TopModal };
