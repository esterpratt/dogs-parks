import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { NotificationModal } from '../components/modals/NotificationModal';

interface NotificationContextType {
  notify: (message?: string, timeout?: number) => void;
  close: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState<string>('Good boy!');
  const [open, setOpen] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const notify = useCallback(
    (msg = 'Good Boy!', timeout = 1500) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      setMessage(msg);
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
      <NotificationModal open={open} message={message} />
    </NotificationContext.Provider>
  );
};
