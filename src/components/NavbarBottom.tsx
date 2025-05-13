import { useContext, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Ellipsis,
  House,
  Info,
  LogIn,
  Map,
  PawPrint,
  Plus,
  Shield,
  UserRound,
  UserRoundSearch,
} from 'lucide-react';
import classnames from 'classnames';
import { UserContext } from '../context/UserContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { NavbarLogoutButton } from './NavbarLogoutButton';
import styles from './NavbarBottom.module.scss';

const NavbarBottom = () => {
  const { userId } = useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useClickOutside({
    ref: menuRef,
    handler: () => {
      setIsMenuOpen(false);
    },
  });

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className={styles.navbar} style={{ height: '64px' }}>
        <div className={styles.iconsContainer}>
          <>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? `${[styles.active]}` : ''
              }
            >
              <div className={styles.item}>
                <House size={24} strokeWidth={2} />
              </div>
            </NavLink>
            <NavLink
              to="/parks"
              end
              className={({ isActive }) =>
                isActive ? `${[styles.active]}` : ''
              }
            >
              <div className={styles.item}>
                <PawPrint size={24} strokeWidth={2} />
              </div>
            </NavLink>
            <NavLink
              to={userId ? `/profile/${userId}` : '/login?mode=login'}
              className={({ isActive }) =>
                isActive ? `${[styles.active]}` : ''
              }
            >
              <div className={styles.item}>
                <UserRound size={24} strokeWidth={2} />
              </div>
            </NavLink>
            <div
              className={styles.moreContainer}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className={styles.item}>
                <Ellipsis size={24} strokeWidth={2} />
              </div>
            </div>
          </>
        </div>
      </nav>
      <div
        ref={menuRef}
        className={classnames(styles.menuContainer, {
          [styles.open]: isMenuOpen,
        })}
      >
        <div className={styles.menuItem}>
          <NavLink
            to="/"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              classnames(styles.inner, { [styles.active]: isActive })
            }
          >
            <Map size={18} strokeWidth={2} />
            <span>Explore</span>
          </NavLink>
        </div>
        <div className={styles.menuItem}>
          <NavLink
            to="/users"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              classnames(styles.inner, { [styles.active]: isActive })
            }
          >
            <UserRoundSearch size={18} strokeWidth={2} />
            <span>Search friends</span>
          </NavLink>
        </div>
        {userId && (
          <div className={styles.menuItem}>
            <NavLink
              to="/parks/new"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                classnames(styles.inner, { [styles.active]: isActive })
              }
            >
              <Plus size={18} strokeWidth={2} />
              <span>Add new park</span>
            </NavLink>
          </div>
        )}
        <div className={styles.menuItem}>
          <NavLink
            to="/privacy-policy"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              classnames(styles.inner, { [styles.active]: isActive })
            }
          >
            <Shield size={18} strokeWidth={2} />
            <span>Privacy policy</span>
          </NavLink>
        </div>
        <div className={styles.menuItem}>
          <NavLink
            to="/about"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              classnames(styles.inner, { [styles.active]: isActive })
            }
          >
            <Info size={18} strokeWidth={2} />
            <span>About</span>
          </NavLink>
        </div>
        {userId ? (
          <div className={styles.menuItem}>
            <NavbarLogoutButton onClick={() => setIsMenuOpen(false)} />
          </div>
        ) : (
          <div className={styles.menuItem}>
            <NavLink
              to="/login?mode=login"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                classnames(styles.inner, { [styles.active]: isActive })
              }
            >
              <LogIn size={18} strokeWidth={2} />
              <span>Login</span>
            </NavLink>
          </div>
        )}
      </div>
    </>
  );
};

export { NavbarBottom };
