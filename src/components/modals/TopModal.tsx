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
  ariaLabelledBy?: string;
  onCancel?: () => void;
}

const TopModal = (props: TopModalProps) => {
  const {
    open,
    onClose,
    children,
    className,
    height,
    ariaLabelledBy,
    onCancel,
  } = props;
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
      aria-labelledby={ariaLabelledBy}
      // Forms may handle Escape themselves to guard in-flight submissions.
      onCancel={
        onCancel
          ? (event) => {
              event.preventDefault();
              onCancel();
            }
          : undefined
      }
      className={classnames(styles.modal, className)}
      onClose={() => {
        // StrictMode can queue a close event while immediately reopening the
        // same dialog. Only a still-closed dialog represents a dismissal.
        if (!dialogRef.current?.open) {
          onClose?.();
        }
      }}
      onClick={onCloseModal}
    >
      {children}
    </dialog>,
    document.getElementById('modal')!,
  );
};

export { TopModal };
