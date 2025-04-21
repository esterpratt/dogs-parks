import { useContext, useState } from 'react';
import { useNavigate } from 'react-router';
import { UserContext } from '../context/UserContext';
import { LogOut, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { EditUserModal } from '../components/profile/EditUserModal';
import { useOrientationContext } from '../context/OrientationContext';
import styles from './UserInfo.module.scss';

const UserInfo = () => {
  const { userLogout, userDeletion } = useContext(UserContext);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const navigate = useNavigate();
  const orientation = useOrientationContext((state) => state.orientation);

  const logout = () => {
    userLogout();
    navigate('/');
  };

  const onEditUser = () => {
    setIsEditUserModalOpen(true);
  };

  const onCloseUserModal = () => {
    setIsEditUserModalOpen(false);
  };

  const onDeleteUser = () => {
    setIsDeleteUserModalOpen(false);
    userDeletion();
  };

  return (
    <>
      <div className={styles.container}>
        <Button onClick={onEditUser} className={styles.button}>
          <Pencil size={24} />
          <span>Edit details</span>
        </Button>
        <Button
          onClick={logout}
          className={styles.button}
          variant="secondary"
          color={styles.blue}
        >
          <LogOut size={24} />
          <span>Logout</span>
        </Button>
        <Button
          variant="secondary"
          color={styles.red}
          onClick={() => setIsDeleteUserModalOpen(true)}
          className={styles.button}
        >
          <Trash2 size={24} />
          <span>Delete my profile</span>
        </Button>
      </div>
      <EditUserModal isOpen={isEditUserModalOpen} onClose={onCloseUserModal} />
      <Modal
        open={isDeleteUserModalOpen}
        onClose={() => setIsDeleteUserModalOpen(false)}
        height={orientation === 'landscape' ? '95%' : '60%'}
        variant="center"
        className={styles.approveModal}
      >
        <div className={styles.approveContent}>
          <span>Hold your leash!</span>
          <span>
            By clicking 'Delete', all your data and your dogs' data will be sent
            to a farm up north where it can run free forever.
          </span>
          <span>Are you sure you want to say goodbye?</span>
        </div>
        <Button
          variant="danger"
          onClick={onDeleteUser}
          className={styles.deleteButton}
        >
          Delete
        </Button>
      </Modal>
    </>
  );
};

export default UserInfo;
