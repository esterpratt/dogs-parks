import { useContext, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { IconContext } from 'react-icons';
import { MdLogout, MdOutlineModeEditOutline } from 'react-icons/md';
import { UserContext } from '../context/UserContext';
import styles from './UserInfo.module.scss';
import { Loading } from '../components/Loading';

const EditUserModal = lazy(() => import('../components/profile/EditUserModal'));

const UserInfo = () => {
  const { userLogout } = useContext(UserContext);
  const [isEditUserModalOpen, setIsEditDogsModalOpen] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    userLogout();
    navigate('/');
  };

  const onEditUser = () => {
    setIsEditDogsModalOpen(true);
  };

  const onCloseUserModal = () => {
    setIsEditDogsModalOpen(false);
  };

  return (
    <>
      <div className={styles.container}>
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
      <Suspense fallback={<Loading />}>
        <EditUserModal
          isOpen={isEditUserModalOpen}
          onClose={onCloseUserModal}
        />
      </Suspense>
    </>
  );
};

export default UserInfo;
