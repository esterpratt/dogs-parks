import { useContext } from 'react';
import { useNavigate, useRevalidator } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { Modal } from '../Modal';
import { Dog } from '../../types/dog';
import styles from './DeleteDogModal.module.scss';
import { UserContext } from '../../context/UserContext';
import { deleteDog } from '../../services/dogs';
import { queryClient } from '../../services/react-query';
import { Button } from '../Button';
import { Loader } from '../Loader';

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
      navigate('..');
    },
  });

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      height="50%"
      variant="center"
      className={styles.approveModal}
    >
      <div className={styles.approveContent}>
        <span>Hold your leash!</span>
        <span>
          By clicking 'Delete', all your dog's data will be sent to a farm up
          north where it can run free forever.
        </span>
        <span>Are you sure you want to say goodbye?</span>
      </div>
      {isPending && <Loader inside />}
      <Button
        variant="danger"
        onClick={() => onDeleteDog(dog.id)}
        className={styles.deleteButton}
      >
        Delete
      </Button>
    </Modal>
  );
};

export default DeleteDogModal;
