import { Park } from '../../types/park';
import { Modal } from '../Modal';
import { EditPark } from './EditPark';
import styles from './EditParkModal.module.scss';

interface EditParksModalProps {
  isOpen: boolean;
  onClose: () => void;
  park: Park;
}

const EditParkModal: React.FC<EditParksModalProps> = ({
  isOpen,
  onClose,
  park,
}) => {
  const onSubmitParkForm = () => {
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
        Can you help us with missing details about this park?
      </div>
      <EditPark park={park} onSubmitForm={onSubmitParkForm} />
    </Modal>
  );
};

export default EditParkModal;
