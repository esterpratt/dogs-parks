import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiHome } from 'react-icons/hi';
import { IconContext } from 'react-icons';
import { GiSittingDog } from 'react-icons/gi';
import { UserContext } from '../context/UserContext';
import styles from './NavbarTop.module.scss';

const NavbarTop = () => {
  const { userId, user } = useContext(UserContext);
  const navigate = useNavigate();

  return (
    <nav className={styles.navbar}>
      <div className={styles.leftBar}>
        <Link
          to={userId ? `/profile/${userId}/dogs` : '/login'}
          className={styles.user}
        >
          <IconContext.Provider value={{ className: styles.dogIcon }}>
            <GiSittingDog />
          </IconContext.Provider>
          Paws Up,{' '}
          <span className={styles.userName}>{user ? user.name : 'Guest'}!</span>
        </Link>
      </div>
      <IconContext.Provider value={{ className: styles.homeIcon }}>
        <HiHome onClick={() => navigate('/')} />
      </IconContext.Provider>
    </nav>
  );
};

export { NavbarTop };
