import { createPortal } from 'react-dom';
import { MouseEvent, ReactNode } from 'react';
import classnames from 'classnames';
import { useModal } from './useModal';
import styles from './AppearModal.module.scss';

interface AppearModalProps {
  open: boolean;
  onClose?: () => void;
  className?: string;
  children: ReactNode;
  height?: number;
  width?: number;
}

const AppearModal = ({
  open,
  onClose,
  children,
  className,
  height = 100,
  width = 100,
}: AppearModalProps) => {
  const dialogRef = useModal(open);

  const onCloseModal = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && onClose) {
      console.log('hi');
      onClose();
    }
  };

  return createPortal(
    <dialog
      style={{ height: `${height}%`, width: `${width}%` }}
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

export { AppearModal };
