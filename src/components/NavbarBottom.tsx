import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { IconContext } from 'react-icons';
import { HiHome } from 'react-icons/hi';
import { FaMapMarkedAlt } from 'react-icons/fa';
import { LuTrees } from 'react-icons/lu';
import { GiSittingDog, GiThreeFriends } from 'react-icons/gi';
import { UserContext } from '../context/UserContext';
import styles from './NavbarBottom.module.scss';

const NavbarBottom = () => {
  const { userId } = useContext(UserContext);

  return (
    <nav className={styles.navbar}>
      <div className={styles.iconsContainer}>
        <IconContext.Provider value={{ className: styles.icons }}>
          <>
            <Link to="/" className={styles.map}>
              <div className={styles.item}>
                <FaMapMarkedAlt />
                <span>Map</span>
              </div>
            </Link>
            <Link to="/parks" className={styles.parks}>
              <div className={styles.item}>
                <LuTrees />
                <span>Parks</span>
              </div>
            </Link>
            <Link to="/" className={styles.home}>
              <div className={styles.item}>
                <HiHome />
              </div>
            </Link>
            <Link to="/users" className={styles.users}>
              <div className={styles.item}>
                <GiThreeFriends />
                <span>Users</span>
              </div>
            </Link>
            <Link
              to={userId ? `/profile/${userId}/dogs` : '/login'}
              className={styles.user}
            >
              <div className={styles.item}>
                <IconContext.Provider value={{ className: styles.dogIcon }}>
                  <GiSittingDog />
                </IconContext.Provider>
                <span>{userId ? 'Profile' : 'Dog In'}</span>
              </div>
            </Link>
          </>
        </IconContext.Provider>
      </div>
    </nav>
  );
};

export { NavbarBottom };
