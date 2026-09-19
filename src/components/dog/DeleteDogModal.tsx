import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useRevalidator } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Trash2, X } from 'lucide-react';
import { Dog } from '../../types/dog';
import { UserContext } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';
import { deleteDog } from '../../services/dogs';
import { queryClient } from '../../services/react-query';
import { Button } from '../Button';
import { Loader } from '../Loader';
import { TopModal } from '../modals/TopModal';
import styles from './DeleteDogModal.module.scss';

interface DeleteDogModalProps {
  isOpen: boolean;
  onClose: () => void;
  dog: Dog;
}

const DeleteDogModal: React.FC<DeleteDogModalProps> = (props) => {
  const { isOpen, onClose, dog } = props;
  const { t } = useTranslation();
  const { notify } = useNotification();
  const { userId } = useContext(UserContext);
  const { revalidate } = useRevalidator();
  const navigate = useNavigate();

  const { mutate: deleteSelectedDog, isPending } = useMutation({
    mutationFn: (id: string) => deleteDog(id),
    onError: () => {
      notify(t('toasts.generic.error'), true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dogs', userId],
      });
      revalidate();

      // Navigate away only after the delete RPC succeeds.
      navigate(`/profile/${userId}/dogs`, { replace: true });
    },
  });

  const handleClose = () => {
    if (isPending) {
      return;
    }

    onClose();
  };

  const handleDelete = () => {
    if (isPending) {
      return;
    }

    deleteSelectedDog(dog.id);
  };

  return (
    <TopModal
      open={isOpen}
      onClose={handleClose}
      className={styles.approveModal}
    >
      <div className={styles.approveContent}>
        <div>
          <span>
            {t('dogs.delete.confirm', {
              name: dog.name,
            })}
          </span>
        </div>
      </div>
      <div className={styles.buttonsContainer}>
        <Button
          variant="primary"
          onClick={handleDelete}
          className={styles.modalButton}
          disabled={isPending}
        >
          {isPending ? (
            <Loader variant="secondary" inside className={styles.loader} />
          ) : (
            <>
              <Trash2 size={16} />
              <span>{t('common.actions.delete')}</span>
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={handleClose}
          className={styles.modalButton}
          disabled={isPending}
        >
          <X size={16} />
          <span>{t('common.actions.cancel')}</span>
        </Button>
      </div>
    </TopModal>
  );
};

export { DeleteDogModal };
