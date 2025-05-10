import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { NotificationModal } from '../components/modals/NotificationModal';

interface NotificationContextType {
  notify: (message?: string, isError?: boolean, timeout?: number) => void;
  close: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState('Good boy!');
  const [isError, setIsError] = useState(false);
  const [open, setOpen] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const notify = useCallback(
    (msg = 'Good Boy!', isError = false, timeout = 1500) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      setMessage(msg);
      setIsError(isError);
      setOpen(true);

      const newTimeoutId = setTimeout(() => {
        setOpen(false);
      }, timeout);

      setTimeoutId(newTimeoutId);
    },
    [timeoutId]
  );

  const close = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setOpen(false);
  }, [timeoutId]);

  return (
    <NotificationContext.Provider value={{ notify, close }}>
      {children}
      <NotificationModal open={open} message={message} isError={isError} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);

  if (!ctx) {
    console.warn('useNotification was called outside NotificationProvider');
    return {
      notify: () => {},
      close: () => {},
    };
  }

  return ctx;
};
