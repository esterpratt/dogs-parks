import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconContext } from 'react-icons';
import { GiSittingDog } from 'react-icons/gi';
import { IoMdMore } from 'react-icons/io';
import { UserContext } from '../context/UserContext';
import styles from './NavbarTop.module.scss';
import { Button } from './Button';
import { MoreModal } from './MoreModal';

const NavbarTop = () => {
  const { userId, user } = useContext(UserContext);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

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
      <Button onClick={() => setIsMoreOpen(true)} className={styles.moreButton}>
        <IconContext.Provider value={{ className: styles.moreIcon }}>
          <IoMdMore />
        </IconContext.Provider>
      </Button>
      <MoreModal open={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </nav>
  );
};

export { NavbarTop };
