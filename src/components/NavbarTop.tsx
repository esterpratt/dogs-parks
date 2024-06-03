import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiHome } from 'react-icons/hi';
import { IconContext } from 'react-icons';
import { GiSittingDog } from 'react-icons/gi';
import { UserContext } from '../context/UserContext';
import styles from './NavbarTop.module.scss';

const NavbarTop = () => {
  const { userId, loadingUserId, isLoadingUser, user } =
    useContext(UserContext);
  const navigate = useNavigate();

  return (
    <nav className={styles.navbar}>
      {isLoadingUser || loadingUserId ? null : (
        <div className={styles.leftBar}>
          <Link
            to={userId ? `/profile/${userId}/dogs` : '/login'}
            className={styles.user}
          >
            <IconContext.Provider value={{ className: styles.dogIcon }}>
              <GiSittingDog />
            </IconContext.Provider>
            Paws Up, {user ? user.name : 'Guest'}!
          </Link>
        </div>
      )}
      <IconContext.Provider value={{ className: styles.homeIcon }}>
        <HiHome onClick={() => navigate('/')} />
      </IconContext.Provider>
    </nav>
  );
};

export { NavbarTop };
