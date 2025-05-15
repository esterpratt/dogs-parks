import { useContext } from 'react';
import { useNavigate, useRevalidator } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Trash2, X } from 'lucide-react';
import { Dog } from '../../types/dog';
import { UserContext } from '../../context/UserContext';
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

const DeleteDogModal: React.FC<DeleteDogModalProps> = ({
  isOpen,
  onClose,
  dog,
}) => {
  const { userId } = useContext(UserContext);
  const { revalidate } = useRevalidator();
  const navigate = useNavigate();

  const { mutateAsync: onDeleteDog, isPending } = useMutation({
    mutationFn: (id: string) => deleteDog(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['dogs', userId],
      });
      revalidate();
    },
    onSettled: () => {
      navigate(`/profile/${userId}/dogs`);
    },
  });

  return (
    <TopModal open={isOpen} onClose={onClose} className={styles.approveModal}>
      <div className={styles.approveContent}>
        <div>
          <span>Are you sure you want to say goodbye to</span>{' '}
          <span className={styles.dogName}>{dog.name}</span>?
        </div>
      </div>
      <div className={styles.buttonsContainer}>
        <Button
          variant="primary"
          onClick={() => onDeleteDog(dog.id)}
          className={styles.modalButton}
          disabled={isPending}
        >
          {isPending ? (
            <Loader inside className={styles.loader} />
          ) : (
            <>
              <Trash2 size={16} />
              <span>Delete</span>
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={onClose}
          className={styles.modalButton}
          disabled={isPending}
        >
          <X size={16} />
          <span>Cancel</span>
        </Button>
      </div>
    </TopModal>
  );
};

export { DeleteDogModal };
