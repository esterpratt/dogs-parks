import { FaCheck } from 'react-icons/fa';
import { IconContext } from 'react-icons';
import { Modal } from './Modal';
import styles from './ThankYouModal.module.scss';
import { useOrientationContext } from '../context/OrientationContext';

interface ThankYouModalProps {
  title?: string;
  open: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({
  title = 'Good Boy!',
  open,
  onClose,
  onAfterClose,
}) => {
  const orientation = useOrientationContext((state) => state.orientation);

  return (
    <Modal
      autoClose
      onAfterClose={onAfterClose}
      open={open}
      onClose={onClose}
      height={orientation === 'landscape' ? '50%' : '20%'}
      className={styles.modal}
      variant="center"
      delay
    >
      <IconContext.Provider value={{ className: styles.icon }}>
        <FaCheck />
      </IconContext.Provider>
      <span className={styles.title}>{title}</span>
    </Modal>
  );
};

export { ThankYouModal };
