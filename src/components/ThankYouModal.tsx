import { useContext } from 'react';
import { FaCheck } from 'react-icons/fa';
import { IconContext } from 'react-icons';
import { Modal } from './Modal';
import styles from './ThankYouModal.module.scss';
import { ThankYouModalContext } from '../context/ThankYouModalContext';

interface ThankYouModalProps {
  title?: string;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({
  title = 'Thank you!',
}) => {
  const { isOpen, setIsOpen } = useContext(ThankYouModalContext);

  return (
    <Modal
      autoClose
      open={isOpen}
      onClose={() => setIsOpen(false)}
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

export { ThankYouModal };
