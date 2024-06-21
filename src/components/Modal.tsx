import { CSSProperties, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import { CgClose } from 'react-icons/cg';
import styles from './Modal.module.scss';
import { ModalSaveButton } from './ModalSaveButton';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  onSave?: () => void;
  saveButtonDisabled?: boolean;
  className?: string;
  variant?: 'top' | 'center' | 'centerTop' | 'bottom' | 'fullScreen' | 'appear';
  height?: string;
  width?: string;
  removeCloseButton?: boolean;
  children: ReactNode;
  autoClose?: boolean;
  delay?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  onSave,
  saveButtonDisabled = false,
  variant = 'centerTop',
  height,
  width,
  children,
  className,
  removeCloseButton,
  autoClose = false,
  delay = false,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const modal = dialogRef.current;
    if (open) {
      modal!.showModal();

      if (autoClose) {
        setTimeout(() => {
          modal!.close();
        }, 2000);
      }
    }

    return () => modal!.close();
  }, [open, autoClose]);

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
      className={classnames(
        styles.modal,
        styles[variant],
        delay && styles.delay
      )}
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
      {onSave && (
        <ModalSaveButton disabled={saveButtonDisabled} onClick={onSave} />
      )}
    </dialog>,
    document.getElementById('modal')!
  );
};

export { Modal };
