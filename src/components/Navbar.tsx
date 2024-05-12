import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiHome, HiOutlineMenu } from 'react-icons/hi';
import { FaUserCircle } from 'react-icons/fa';
import { IconContext } from 'react-icons';
import { UserContext } from '../context/UserContext';
import styles from './Navbar.module.scss';

const Navbar = () => {
  const { userId, loadingUserId, user } = useContext(UserContext);
  const navigate = useNavigate();

  return (
    <nav className={styles.navbar}>
      <IconContext.Provider value={{ className: styles.icons, size: '32' }}>
        {loadingUserId ? null : (
          <div className={styles.leftBar}>
            <HiOutlineMenu />
            <Link
              to={userId ? `/profile/${userId}/dogs` : '/login'}
              className={styles.user}
            >
              <FaUserCircle />
              {user ? user.name : 'Guest'}
            </Link>
          </div>
        )}
        <HiHome onClick={() => navigate('/')} />
      </IconContext.Provider>
    </nav>
  );
};

export { Navbar };
