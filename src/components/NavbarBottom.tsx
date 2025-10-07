import { useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import {
  Bell,
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
import { useNotificationCount } from '../hooks/api/useNotificationCount';
import styles from './NavbarBottom.module.scss';
import { LanguageSwitcher } from './LanguageSwitcher';

const NavbarBottom = () => {
  const { t } = useTranslation();
  const { userId } = useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const moreButtonRef = useRef(null);

  const unseenNotificationCount = useNotificationCount();

  useClickOutside({
    refs: [menuRef, moreButtonRef],
    handler: () => {
      setIsMenuOpen(false);
    },
  });

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div
          className={classnames(styles.iconsContainer, {
            [styles.loggedIn]: userId,
            [styles.loggedOut]: !userId,
          })}
        >
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
              <div className={classnames(styles.item, styles.parksLink)}>
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
            {userId && (
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  isActive ? `${[styles.active]}` : ''
                }
                data-test="navbar-notifications-link"
              >
                <div className={styles.item}>
                  <div className={styles.notificationContainer}>
                    <Bell size={24} strokeWidth={2} />
                    {unseenNotificationCount > 0 && (
                      <div className={styles.notificationBadge}>
                        {unseenNotificationCount > 99
                          ? '99+'
                          : unseenNotificationCount}
                      </div>
                    )}
                  </div>
                </div>
              </NavLink>
            )}
            <div
              ref={moreButtonRef}
              className={styles.moreContainer}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-test="navbar-more"
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
            <span>{t('nav.bottom.explore')}</span>
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
            <span>{t('nav.bottom.searchFriends')}</span>
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
              <span>{t('nav.bottom.addPark')}</span>
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
            <span>{t('nav.bottom.privacy')}</span>
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
            <span>{t('nav.bottom.about')}</span>
          </NavLink>
        </div>
        <div className={styles.menuItem}>
          <LanguageSwitcher
            className={styles.inner}
            onClick={() => setIsMenuOpen(false)}
          />
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
              <span>{t('nav.bottom.login')}</span>
            </NavLink>
          </div>
        )}
      </div>
    </>
  );
};

export { NavbarBottom };
