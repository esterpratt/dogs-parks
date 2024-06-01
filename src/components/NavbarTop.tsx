import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiHome } from 'react-icons/hi';
import { FaUserCircle } from 'react-icons/fa';
import { IconContext } from 'react-icons';
import { UserContext } from '../context/UserContext';
import styles from './NavbarTop.module.scss';

const NavbarTop = () => {
  const { userId, loadingUserId, isLoadingUser, user } =
    useContext(UserContext);
  const navigate = useNavigate();

  return (
    <nav className={styles.navbar}>
      <IconContext.Provider value={{ className: styles.icons, size: '32' }}>
        {isLoadingUser || loadingUserId ? null : (
          <div className={styles.leftBar}>
            <Link
              to={userId ? `/profile/${userId}/dogs` : '/login'}
              className={styles.user}
            >
              <FaUserCircle />
              Hewo {user ? user.name : 'Guest'}!
            </Link>
          </div>
        )}
        <HiHome onClick={() => navigate('/')} />
      </IconContext.Provider>
    </nav>
  );
};

export { NavbarTop };
