import { MapPinCheckInside, X } from 'lucide-react';
import { Button } from '../Button';
import { TopModal } from '../modals/TopModal';
import styles from './CheckoutFromAnotherParkModal.module.scss';

interface CheckoutFromAnotherParkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckin: () => void;
}

const CheckoutFromAnotherParkModal: React.FC<
  CheckoutFromAnotherParkModalProps
> = ({ isOpen, onClose, onCheckin }) => {
  return (
    <TopModal open={isOpen} onClose={onClose} className={styles.modal}>
      <div className={styles.content}>
        <span>Are you Schrödinger's dog?</span>
        <span>
          You are currently checked in at another park. Do you want to check in
          here instead?
        </span>
      </div>
      <div className={styles.buttonsContainer}>
        <Button variant="primary" onClick={onCheckin} className={styles.button}>
          <MapPinCheckInside size={14} />
          <span>Checkin here</span>
        </Button>
        <Button variant="secondary" onClick={onClose} className={styles.button}>
          <X size={14} />
          <span>Cancel</span>
        </Button>
      </div>
    </TopModal>
  );
};

export default CheckoutFromAnotherParkModal;
