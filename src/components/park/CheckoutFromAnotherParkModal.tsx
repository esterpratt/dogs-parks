import { MapPinCheckInside, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <TopModal open={isOpen} onClose={onClose} className={styles.modal}>
      <div className={styles.content}>
        <span>{t('parks.checkin.alreadyTitle')}</span>
        <span>{t('parks.checkin.alreadyBody')}</span>
      </div>
      <div className={styles.buttonsContainer}>
        <Button variant="primary" onClick={onCheckin} className={styles.button}>
          <MapPinCheckInside size={14} />
          <span>{t('parks.checkin.switchHere')}</span>
        </Button>
        <Button variant="secondary" onClick={onClose} className={styles.button}>
          <X size={14} />
          <span>{t('common.actions.cancel')}</span>
        </Button>
      </div>
    </TopModal>
  );
};

export default CheckoutFromAnotherParkModal;
