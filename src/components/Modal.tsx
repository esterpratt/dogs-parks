import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

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
      style={{ width: '600px', height: '800px' }}
      ref={dialogRef}
      onClose={onClose}
      className={className}
    >
      {children}
    </dialog>,
    document.getElementById('modal')!
  );
};

export { Modal };
