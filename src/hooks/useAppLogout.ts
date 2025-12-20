import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { isMobile } from '../utils/platform';
import { SignOutResult } from '../types/auth';

const useAppLogout = () => {
  const { userLogoutAsync } = useContext(UserContext);
  const navigate = useNavigate();

  const logout = async (): Promise<void> => {
    navigate('/');

    const result = await userLogoutAsync();

    if (result === SignOutResult.FORCED_LOGOUT) {
      if (isMobile()) {
        navigate('/login?mode=login', { replace: true });
      } else {
        window.location.reload();
      }
    }
  };

  return { logout };
};

export { useAppLogout };
