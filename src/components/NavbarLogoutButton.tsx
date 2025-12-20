import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppLogout } from '../hooks/useAppLogout';
import { Button } from './Button';
import styles from './NavbarBottom.module.scss';

interface NavbarLogoutButtonProps {
  onClick: () => void;
}

const NavbarLogoutButton = (props: NavbarLogoutButtonProps) => {
  const { onClick } = props;
  const { t } = useTranslation();
  const { logout } = useAppLogout();

  const onLogout = () => {
    logout();
    onClick();
  };

  return (
    <Button
      variant="simple"
      color={styles.blue}
      onClick={onLogout}
      className={styles.inner}
      data-test="navbar-logout"
    >
      <LogOut size={18} strokeWidth={2} />
      <span>{t('common.actions.logout')}</span>
    </Button>
  );
};

export { NavbarLogoutButton };
