import { FaCheck } from 'react-icons/fa';
import { IconContext } from 'react-icons';
import { Modal } from './Modal';
import styles from './ThankYouModal.module.scss';

interface ThankYouModalProps {
  title?: string;
  open: boolean;
  onClose: () => void;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({
  title = 'Good Boy!',
  open,
  onClose,
}) => {
  return (
    <Modal
      autoClose
      open={open}
      onClose={onClose}
      height="20%"
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

export default ThankYouModal;
