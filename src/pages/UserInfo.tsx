import { useContext, useState } from 'react';
import { useNavigate } from 'react-router';
import { IconContext } from 'react-icons';
import { MdLogout, MdOutlineModeEditOutline } from 'react-icons/md';
import { IoTrashOutline } from 'react-icons/io5';
import classnames from 'classnames';
import { UserContext } from '../context/UserContext';
import styles from './UserInfo.module.scss';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { EditUserModal } from '../components/profile/EditUserModal';
import { useOrientationContext } from '../context/OrientationContext';

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
    userDeletion();
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.rowsWrapper}>
          <div onClick={onEditUser} className={styles.row}>
            <IconContext.Provider value={{ className: styles.icon }}>
              <MdOutlineModeEditOutline />
            </IconContext.Provider>
            <span>Edit Details</span>
          </div>
          <div onClick={logout} className={styles.row}>
            <IconContext.Provider value={{ className: styles.icon }}>
              <MdLogout />
            </IconContext.Provider>
            <span>Logout</span>
          </div>
        </div>
        <div className={styles.rowsWrapper}>
          <div
            onClick={() => setIsDeleteUserModalOpen(true)}
            className={styles.row}
          >
            <IconContext.Provider
              value={{ className: classnames(styles.icon, styles.deleteIcon) }}
            >
              <IoTrashOutline />
            </IconContext.Provider>
            <span>Delete My User Profile</span>
          </div>
        </div>
      </div>
      <EditUserModal isOpen={isEditUserModalOpen} onClose={onCloseUserModal} />
      <Modal
        open={isDeleteUserModalOpen}
        onClose={() => setIsDeleteUserModalOpen(false)}
        height={orientation === 'landscape' ? '95%' : '60%'}
        style={
          orientation === 'landscape' && isDeleteUserModalOpen
            ? { margin: 'auto' }
            : {}
        }
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
