import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { LogOut, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '../components/Button';
import { EditUserModal } from '../components/profile/EditUserModal';
import { TopModal } from '../components/modals/TopModal';
import { ThemeToggle } from '../components/profile/ThemeToggle';
import styles from './UserInfo.module.scss';
import { useTranslation } from 'react-i18next';

const UserInfo = () => {
  const { userLogout, userDeletion } = useContext(UserContext);
  const { t } = useTranslation();
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const navigate = useNavigate();

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
        <div className={styles.themeContainer}>
          <ThemeToggle />
        </div>
        <Button onClick={onEditUser} className={styles.button}>
          <Pencil size={24} />
          <span>{t('userInfo.editDetails')}</span>
        </Button>
        <Button
          onClick={logout}
          className={styles.button}
          variant="secondary"
          color={styles.blue}
        >
          <LogOut size={24} />
          <span>{t('userInfo.logout')}</span>
        </Button>
        <Button
          variant="secondary"
          color={styles.red}
          onClick={() => setIsDeleteUserModalOpen(true)}
          className={styles.button}
        >
          <Trash2 size={24} />
          <span>{t('userInfo.deleteProfile')}</span>
        </Button>
      </div>
      <EditUserModal isOpen={isEditUserModalOpen} onClose={onCloseUserModal} />
      <TopModal
        open={isDeleteUserModalOpen}
        onClose={() => setIsDeleteUserModalOpen(false)}
        className={styles.approveModal}
      >
        <div className={styles.approveContent}>
          <span>{t('userInfo.deleteModalTitle')}</span>
          <span>{t('userInfo.deleteModalBody1')}</span>
          <span>{t('userInfo.deleteModalBody2')}</span>
        </div>
        <div className={styles.buttonsContainer}>
          <Button
            variant="primary"
            onClick={onDeleteUser}
            className={styles.modalButton}
          >
            <Trash2 size={16} />
            <span>{t('userInfo.delete')}</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsDeleteUserModalOpen(false)}
            className={styles.modalButton}
          >
            <X size={16} />
            <span>{t('userInfo.cancel')}</span>
          </Button>
        </div>
      </TopModal>
    </>
  );
};

export default UserInfo;
