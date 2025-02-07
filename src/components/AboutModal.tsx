import { Modal } from './Modal';
import styles from './AboutModal.module.scss';
import { Link } from 'react-router';
import { MAIL } from '../services/reports';
import { useOrientationContext } from '../context/OrientationContext';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ open, onClose }) => {
  const orientation = useOrientationContext((state) => state.orientation);

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="centerTop"
      height={orientation === 'landscape' ? '95%' : '65%'}
      style={orientation === 'landscape' && open ? { margin: 'auto' } : {}}
      className={styles.modalContent}
    >
      <h3>Welcome to Klavhub!</h3>
      <Link onClick={onClose} to="/privacy-policy">
        See our Privacy Policy
      </Link>
      <div>
        <span>This app was created by: </span>
        <Link to="https://github.com/esterpratt">Ester Pratt.</Link>
      </div>
      <div>
        <span>Inspired by: </span>
        My special dog Nina, the dog who doesn't go to dog parks.
      </div>
      <div>
        <span>Special thanks to: </span>Kfir Arad, Rotem Koltz
      </div>
      <div>
        <span>Your support is greatly appreciated! </span>
        This app is just getting started, and I would love your help in growing
        the community. You can support by joining the community, sharing with
        friends, adding details about your local dog park, and contributing
        missing parks. For any suggestions or feedback, feel free to email me
        at: <Link to={`mailto:${MAIL}`}>{MAIL}</Link>
      </div>
    </Modal>
  );
};

export { AboutModal };
