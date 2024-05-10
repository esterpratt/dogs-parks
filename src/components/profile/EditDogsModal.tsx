import { useEffect, useState } from 'react';
import { Modal } from '../Modal';
import { Dog } from '../../types/dog';
import { EditDog } from './EditDog';
import styles from './EditDogsModal.module.scss';

interface EditDogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dogs?: Dog[];
  currentDogId?: string;
}

const EditDogsModal: React.FC<EditDogsModalProps> = ({
  isOpen,
  onClose,
  dogs,
  currentDogId,
}) => {
  const [dogIdToEdit, setDogIdToEdit] = useState(currentDogId);
  const dogToEdit =
    dogs && dogs.length === 1
      ? dogs[0]
      : dogs?.find((dog) => dog.id === dogIdToEdit);

  useEffect(() => {
    setDogIdToEdit(currentDogId);
  }, [currentDogId]);

  const onSubmitDogsForm = () => {
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} className={styles.modal}>
      <div className={styles.title}>
        {dogToEdit ? `Edit ${dogToEdit.name}` : 'Add your dog'} details
      </div>
      <EditDog dog={dogToEdit} onSubmitForm={onSubmitDogsForm} />
    </Modal>
  );
};

export { EditDogsModal };
