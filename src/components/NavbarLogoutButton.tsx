import { LogOut } from 'lucide-react';
import { Button } from './Button';
import styles from './NavbarBottom.module.scss';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

interface NavbarLogoutButtonProps {
  onClick: () => void;
}

const NavbarLogoutButton = (props: NavbarLogoutButtonProps) => {
  const { onClick } = props;
  const { userLogout } = useContext(UserContext);
  const navigate = useNavigate();

  const logout = () => {
    userLogout();
    onClick();
    navigate('/');
  };

  return (
    <Button
      variant="simple"
      color={styles.blue}
      onClick={logout}
      className={styles.inner}
    >
      <LogOut size={18} strokeWidth={2} />
      <span>Logout</span>
    </Button>
  );
};

export { NavbarLogoutButton };
