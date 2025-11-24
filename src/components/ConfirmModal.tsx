import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { TopModal } from './modals/TopModal';
import { Loader } from './Loader';
import styles from './ConfirmModal.module.scss';

interface ConfirmModalProps {
  isOpen: boolean;
  handleClose: () => void;
  handleConfirm: () => void;
  isPending?: boolean;
  title?: string;
  confirmationText?: string;
}

const ConfirmModal = (props: ConfirmModalProps) => {
  const {
    isOpen,
    handleClose,
    handleConfirm,
    isPending,
    title,
    confirmationText,
  } = props;
  const { t } = useTranslation();

  return (
    <TopModal open={isOpen} onClose={handleClose} className={styles.modal}>
      <div className={styles.content}>
        <span className={styles.title}>
          {title ?? t('common.actions.areYouSure')}
        </span>
      </div>
      <div className={styles.buttonsContainer}>
        <Button
          variant="primary"
          onClick={handleConfirm}
          className={styles.modalButton}
          disabled={isPending}
        >
          {isPending ? (
            <Loader variant="secondary" inside className={styles.loader} />
          ) : (
            <span>{confirmationText ?? t('common.actions.yes')}</span>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={handleClose}
          className={styles.modalButton}
          disabled={isPending}
        >
          <span>{t('common.actions.cancel')}</span>
        </Button>
      </div>
    </TopModal>
  );
};

export { ConfirmModal };
