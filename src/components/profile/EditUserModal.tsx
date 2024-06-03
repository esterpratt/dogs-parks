import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { Modal } from '../Modal';
import { EditUser } from './EditUser';
import styles from './EditUserModal.module.scss';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose }) => {
  const { user } = useContext(UserContext);

  if (!user) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      className={styles.modal}
      height="50%"
    >
      <div className={styles.title}>Update your details</div>
      <EditUser user={user} onSubmitForm={onClose} />
    </Modal>
  );
};

export { EditUserModal };
