import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { TopModal } from '../modals/TopModal';
import { Loader } from '../Loader';
import styles from './DeclineInviteeModal.module.scss';

interface DeclineInviteeModalProps {
  isOpen: boolean;
  closeModal: () => void;
  handleDeclineInvite: () => void;
  isPendingDecline: boolean;
}

const DeclineInviteeModal = (props: DeclineInviteeModalProps) => {
  const { isOpen, closeModal, handleDeclineInvite, isPendingDecline } = props;
  const { t } = useTranslation();

  return (
    <TopModal open={isOpen} onClose={closeModal}>
      <div className={styles.declineModal}>
        <div>
          <span>{t('event.invitee.decline.title')}</span>
        </div>
      </div>
      <div className={styles.buttonsContainer}>
        <Button
          variant="primary"
          onClick={handleDeclineInvite}
          className={styles.modalButton}
          disabled={isPendingDecline}
        >
          {isPendingDecline ? (
            <Loader variant="secondary" inside className={styles.loader} />
          ) : (
            <span>{t('event.invitee.decline.button')}</span>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={closeModal}
          className={styles.modalButton}
          disabled={isPendingDecline}
        >
          <span>{t('common.actions.cancel')}</span>
        </Button>
      </div>
    </TopModal>
  );
};

export { DeclineInviteeModal };
