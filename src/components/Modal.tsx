import { CSSProperties, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import { CgClose } from 'react-icons/cg';
import styles from './Modal.module.scss';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  className?: string;
  variant?: 'center' | 'bottom' | 'fullScreen';
  height?: string;
  width?: string;
  removeCloseButton?: boolean;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  variant = 'center',
  height,
  width,
  children,
  className,
  removeCloseButton,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const modal = dialogRef.current;
    if (open) {
      modal!.showModal();
    }

    return () => modal!.close();
  }, [open]);

  const style: CSSProperties = {};

  if (height) {
    style.height = height;
  }
  if (width) {
    style.width = width;
  }

  return createPortal(
    <dialog
      style={style}
      ref={dialogRef}
      onClose={onClose}
      className={classnames(styles.modal, styles[variant])}
      onClick={onClose}
    >
      <div
        className={classnames(styles.content, className)}
        onClick={(event) => event?.stopPropagation()}
      >
        {!removeCloseButton && (
          <CgClose onClick={onClose} size={24} className={styles.close} />
        )}
        {children}
      </div>
    </dialog>,
    document.getElementById('modal')!
  );
};

export { Modal };
