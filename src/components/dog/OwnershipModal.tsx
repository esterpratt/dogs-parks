import { ReactNode, useId } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TopModal } from '../modals/TopModal';
import { Button } from '../Button';
import styles from '../../pages/DogOwnership.module.scss';

interface OwnershipModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  isPending?: boolean;
}

const OwnershipModal = (props: OwnershipModalProps) => {
  const { title, children, onClose, isPending = false } = props;
  const { t } = useTranslation();
  const titleId = useId();
  // Match the app's form dialogs and keep submitted actions on screen until
  // the server responds, including attempts to dismiss with Escape.
  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };
  return (
    <TopModal
      open
      onClose={handleClose}
      onCancel={handleClose}
      className={styles.modal}
      ariaLabelledBy={titleId}
    >
      <div className={styles.modalHeader}>
        <h2 id={titleId}>{title}</h2>
        <Button
          variant="simple"
          aria-label={t('common.actions.cancel')}
          onClick={handleClose}
          disabled={isPending}
        >
          <X size={20} />
        </Button>
      </div>
      <div className={styles.actions} aria-busy={isPending}>
        {children}
      </div>
    </TopModal>
  );
};

export { OwnershipModal };
