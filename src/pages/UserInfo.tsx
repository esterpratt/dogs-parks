import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router';

const UserInfo = () => {
  const { userLogout } = useContext(UserContext);
  const navigate = useNavigate();

  const logout = () => {
    userLogout();
    navigate('/');
  };

  return <div onClick={logout}>Logout</div>;
};

export { UserInfo };
