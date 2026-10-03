import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, MoveLeft, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { useAppLogout } from '../hooks/useAppLogout';
import { Button } from '../components/Button';
import { EditUserModal } from '../components/profile/EditUserModal';
import { ThemeToggle } from '../components/profile/ThemeToggle';
import { PrevLinks } from '../components/PrevLinks';
import styles from './Settings.module.scss';

const Settings = () => {
  const { userId } = useContext(UserContext);
  const { t } = useTranslation();
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const { logout } = useAppLogout();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
  };

  const onEditUser = () => {
    setIsEditUserModalOpen(true);
  };

  const onCloseUserModal = () => {
    setIsEditUserModalOpen(false);
  };

  return (
    <>
      <PrevLinks
        links={{
          to: `/profile/${userId}`,
          icon: <MoveLeft size={16} />,
          text: t('settings.backToProfile'),
        }}
      />
      <div className={styles.container}>
        <div className={styles.title}>{t('settings.title')}</div>
        <div className={styles.formContainer}>
          <div className={styles.themeContainer}>
            <ThemeToggle />
          </div>
          <Button onClick={onEditUser} className={styles.button}>
            <Pencil size={24} />
            <span>{t('settings.editDetails')}</span>
          </Button>
          <Button
            onClick={onLogout}
            className={styles.button}
            variant="secondary"
            color={styles.blue}
          >
            <LogOut size={24} />
            <span>{t('settings.logout')}</span>
          </Button>
          <Button
            variant="secondary"
            color={styles.red}
            onClick={() =>
              navigate(`/profile/${userId}/settings/delete-account`)
            }
            className={styles.button}
          >
            <Trash2 size={24} />
            <span>{t('settings.deleteProfile')}</span>
          </Button>
        </div>
      </div>
      <EditUserModal isOpen={isEditUserModalOpen} onClose={onCloseUserModal} />
    </>
  );
};

export default Settings;
