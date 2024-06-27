import { Modal } from './Modal';
import styles from './AboutModal.module.scss';
import { Link } from 'react-router-dom';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ open, onClose }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="centerTop"
      height="50%"
      className={styles.modalContent}
    >
      <h3>About Klavhub</h3>
      <div>
        <span>Created by: </span>
        <Link to="https://github.com/esterpratt">Ester Pratt</Link>
      </div>
      <div>
        <span>Inspired by: </span>
        My special dog Nina, the dog that isn't hanging at dogs' parks
      </div>
      <div>
        <span>Special thanks to: </span>Kfir Arad, Rotem Koltz
      </div>
      <div>
        <span>You can help! </span>I would greatly appreciate it if you could:
        Join the community, add friends, add details about your parks, and add
        any missing parks you notice.
      </div>
    </Modal>
  );
};

export { AboutModal };
