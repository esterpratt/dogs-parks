import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { Modal } from '../Modal';

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
    <Modal open={isOpen} onClose={onClose}>
      <div>Edit user {user.name}</div>;
    </Modal>
  );
};

export { EditUserModal };
