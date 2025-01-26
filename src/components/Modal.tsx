import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classnames from 'classnames';
import { CgClose } from 'react-icons/cg';
import styles from './Modal.module.scss';
import { Button } from './Button';
import useKeyboardFix from '../hooks/useKeyboardFix';

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
  hideBackdrop?: boolean;
  style?: CSSProperties;
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
  hideBackdrop = false,
  style = {},
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const keyboardHeight = useKeyboardFix();

  const [shouldMinHeight, setShouldMinHeight] = useState(false);

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

  if (height) {
    style.height = height;
  }
  if (width) {
    style.width = width;
  }

  useEffect(() => {
    const modal = dialogRef.current;

    if (!modal) {
      return;
    }

    if (!keyboardHeight) {
      setShouldMinHeight(false);
      return;
    }

    if (
      keyboardHeight -
        (window.innerHeight - modal.getBoundingClientRect().bottom) >
      0
    ) {
      setShouldMinHeight(true);
    }
  }, [keyboardHeight]);

  return createPortal(
    <dialog
      style={{ ...style, '--keyboard-height': `${keyboardHeight}px` }}
      ref={dialogRef}
      onClose={onClose}
      className={classnames(
        styles.modal,
        styles[variant],
        delay && styles.delay,
        hideBackdrop && styles.hideBackdrop,
        shouldMinHeight && styles.withMinimizeHeight
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
        <div
          className={styles.buttonContainer}
          onClick={(event) => event?.stopPropagation()}
        >
          <Button
            variant="green"
            onClick={onSave}
            disabled={saveButtonDisabled}
          >
            Save
          </Button>
        </div>
      )}
    </dialog>,
    document.getElementById('modal')!
  );
};

export { Modal };
