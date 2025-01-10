import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconContext } from 'react-icons';
import { GiSittingDog } from 'react-icons/gi';
import { FaInfo } from 'react-icons/fa6';
import { UserContext } from '../context/UserContext';
import styles from './NavbarTop.module.scss';
import { Button } from './Button';
import { AboutModal } from './AboutModal';

const NavbarTop = () => {
  const { userId, user } = useContext(UserContext);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <div className={styles.content}>
        <div className={styles.leftBar}>
          <Link
            to={userId ? `/profile/${userId}/dogs` : '/login'}
            className={styles.user}
          >
            <IconContext.Provider value={{ className: styles.dogIcon }}>
              <GiSittingDog />
            </IconContext.Provider>
            Paws Up,{' '}
            <span className={styles.userName}>
              {user ? user.name : 'Guest'}!
            </span>
          </Link>
        </div>
        <Button
          onClick={() => setIsAboutOpen(true)}
          className={styles.aboutButton}
        >
          <IconContext.Provider value={{ className: styles.aboutIcon }}>
            <FaInfo />
          </IconContext.Provider>
        </Button>
        <AboutModal open={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      </div>
    </nav>
  );
};

export { NavbarTop };
