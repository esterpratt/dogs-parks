import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { IconContext } from 'react-icons';
import { HiHome } from 'react-icons/hi';
import { FaUserCircle, FaMapMarkedAlt } from 'react-icons/fa';
import { LuTrees } from 'react-icons/lu';
import { GiThreeFriends } from 'react-icons/gi';
import { UserContext } from '../context/UserContext';
import styles from './NavbarBottom.module.scss';

const NavbarBottom = () => {
  const { userId, loadingUserId } = useContext(UserContext);

  return (
    <nav className={styles.navbar}>
      <div className={styles.iconsContainer}>
        <IconContext.Provider value={{ className: styles.icons }}>
          {loadingUserId ? null : (
            <>
              <Link to="/" className={styles.map}>
                <FaMapMarkedAlt />
                <span>Map</span>
              </Link>
              <Link to="/parks" className={styles.parks}>
                <LuTrees />
                <span>Parks</span>
              </Link>
              <Link to="/" className={styles.home}>
                <HiHome />
              </Link>
              <Link to="/users" className={styles.users}>
                <GiThreeFriends />
                <span>Users</span>
              </Link>
              <Link
                to={userId ? `/profile/${userId}/dogs` : '/login'}
                className={styles.user}
              >
                <FaUserCircle />
                <span>{userId ? 'Profile' : 'Log In'}</span>
              </Link>
            </>
          )}
        </IconContext.Provider>
      </div>
    </nav>
  );
};

export { NavbarBottom };
