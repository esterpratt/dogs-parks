import { useState } from 'react';
import { FaRegCircleQuestion } from 'react-icons/fa6';
import { Modal } from './Modal';
import { AboutModal } from './AboutModal';
import styles from './MoreModal.module.scss';
import { IconContext } from 'react-icons';

interface MoreModalProps {
  open: boolean;
  onClose: () => void;
}

const MoreModal: React.FC<MoreModalProps> = ({ open, onClose }) => {
  const [isOpenAbout, setIsOpenAbout] = useState(false);

  const onOpenAbout = () => {
    setIsOpenAbout(true);
  };

  const onCloseAbout = () => {
    setIsOpenAbout(false);
    onClose();
  };

  return (
    <>
      <Modal
        variant="top"
        open={open}
        onClose={onClose}
        removeCloseButton
        className={styles.modalContent}
      >
        <ul className={styles.nav}>
          <li onClick={onOpenAbout}>
            <IconContext.Provider value={{ className: styles.icon }}>
              <FaRegCircleQuestion />
            </IconContext.Provider>
            <span>About</span>
          </li>
        </ul>
      </Modal>
      <AboutModal open={isOpenAbout} onClose={onCloseAbout} />
    </>
  );
};

export { MoreModal };
