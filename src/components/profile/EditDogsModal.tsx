import { Modal } from '../Modal';
import { Dog } from '../../types/dog';
import { EditDog } from './EditDog';
import styles from './EditDogsModal.module.scss';

interface EditDogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDog?: (dogId?: string) => void;
  dog?: Dog;
}

const EditDogsModal: React.FC<EditDogsModalProps> = ({
  isOpen,
  onClose,
  onAddDog,
  dog,
}) => {
  const onSubmitDogsForm = () => {
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      className={styles.modal}
      height="90%"
    >
      <div className={styles.title}>
        {dog ? `Update ${dog.name}'s` : `Add your dog's`} details
      </div>
      <EditDog dog={dog} onSubmitForm={onSubmitDogsForm} onAddDog={onAddDog} />
    </Modal>
  );
};

export default EditDogsModal;
