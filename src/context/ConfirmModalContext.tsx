import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

interface ModalConfig {
  title: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
}

interface ConfirmModalContextObj {
  showModal: (options: ModalConfig) => void;
}

const initialData: ConfirmModalContextObj = {
  showModal: () => {},
};

const ConfirmModalContext = createContext<ConfirmModalContextObj>(initialData);

interface ConfirmModalContextProviderProps {
  children: ReactNode;
}

const ConfirmModalProvider = (props: ConfirmModalContextProviderProps) => {
  const { children } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);

  const showModal = useCallback((options: ModalConfig) => {
    setModalConfig(options);
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setModalConfig(null);
  };

  const handleConfirm = async () => {
    if (!modalConfig) {
      return;
    }

    setIsPending(true);

    try {
      await modalConfig.onConfirm();
      handleClose();
    } finally {
      setIsPending(false);
    }
  };

  const value = useMemo(() => ({ showModal }), [showModal]);

  return (
    <ConfirmModalContext.Provider value={value}>
      {children}
      <ConfirmModal
        title={modalConfig?.title}
        confirmationText={modalConfig?.confirmText}
        cancelText={modalConfig?.cancelText}
        handleClose={handleClose}
        handleConfirm={handleConfirm}
        isOpen={isOpen}
        isPending={isPending}
      />
    </ConfirmModalContext.Provider>
  );
};

const useConfirm = () => {
  const context = useContext(ConfirmModalContext);

  if (!context) {
    throw new Error('useConfirm was called outside ConfirmModalContext');
  }

  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export { ConfirmModalProvider, useConfirm };
